import '@pn-server-only'
import { classAuth } from './auth'
import { classSchemas } from './schemas'
import { implementGroupType, implementStraightAwayMigration } from '@/services/groups/implementGroupType'
import { CLASS_LEVEL_ORDERING } from '@/services/groups/constants'
import { omegaOrderOperations } from '@/services/omegaOrder/operations'
import { defineOperation } from '@/services/serviceOperation'
import { invalidateManyUserSessionData, invalidateOneUserSessionData } from '@/services/auth/invalidateSession'
import { GroupType } from '@/prisma-generated-pn-types'
import type { ClassLevel } from '@/prisma-generated-pn-types'

/**
 * The level a user moves up into from the given one, or null when there is nowhere left to go -
 * GRADUATED is terminal.
 */
function nextClassLevel(level: ClassLevel): ClassLevel | null {
    const nextIndex = CLASS_LEVEL_ORDERING.indexOf(level) + 1
    return CLASS_LEVEL_ORDERING[nextIndex] ?? null
}

const commonGroupOperations = implementGroupType({
    type: GroupType.CLASS,
    auth: {
        readExpanded: classAuth.readExpanded.dynamicFields({}),
        readMembers: () => classAuth.readMembers.dynamicFields({}),
    },
})

const migration = implementStraightAwayMigration({
    type: GroupType.CLASS,
    auth: {
        migrateGroups: classAuth.migrateGroups.dynamicFields({}),
    },
})

const readMany = defineOperation({
    authorizer: () => classAuth.readMany.dynamicFields({}),
    operation: async ({ prisma }) => prisma.class.findMany()
})

const read = defineOperation({
    paramsSchema: classSchemas.read,
    authorizer: () => classAuth.read.dynamicFields({}),
    operation: async ({ prisma, params }) => prisma.class.findUniqueOrThrow({
        where: params,
    })
})

/**
 * Puts the user in the given class for one order. A user holds at most one class membership per
 * order, so whatever class they were in for that order is removed rather than deactivated - this
 * corrects which class they are in, it does not record that they moved.
 */
const changeClassOfUser = defineOperation({
    paramsSchema: classSchemas.changeClassOfUser,
    authorizer: () => classAuth.changeClassOfUser.dynamicFields({}),
    opensTransaction: true,
    operation: async ({ prisma, params }) => {
        const targetClass = await prisma.class.findUniqueOrThrow({
            where: { level: params.level },
            select: {
                groupId: true,
                group: { select: { order: true } },
            },
        })
        const order = params.order ?? targetClass.group.order

        const membership = await prisma.$transaction(async tx => {
            await tx.membership.deleteMany({
                where: {
                    userId: params.userId,
                    order,
                    group: { groupType: GroupType.CLASS },
                },
            })

            return tx.membership.create({
                data: {
                    userId: params.userId,
                    groupId: targetClass.groupId,
                    order,
                    active: true,
                    admin: false,
                },
            })
        })

        await invalidateOneUserSessionData(params.userId)
        return membership
    }
})

/**
 * Moves everyone up one class. Every active class membership left behind in an earlier order is
 * deactivated, and the user gets a fresh active membership of the current order in the next level
 * up. GRADUATED is terminal: those memberships are left exactly as they are, active, in the order
 * they were granted.
 *
 * A user who already holds a class membership of the current order - a new student registered
 * straight into their class, say - only has the old one deactivated, so that the one-class-per-order
 * rule holds.
 */
const bumpClasses = defineOperation({
    authorizer: () => classAuth.bumpClasses.dynamicFields({}),
    opensTransaction: true,
    operation: async ({ prisma }) => {
        const { order: currentOrder } = await omegaOrderOperations.readCurrent({ bypassAuth: true })

        const classGroups = await prisma.class.findMany({
            select: { groupId: true, level: true },
        })
        const groupIdByLevel = new Map(classGroups.map(classGroup => [classGroup.level, classGroup.groupId]))

        const membershipsToBump = await prisma.membership.findMany({
            where: {
                active: true,
                order: { lt: currentOrder },
                group: {
                    groupType: GroupType.CLASS,
                    class: { level: { not: 'GRADUATED' } },
                },
            },
            select: {
                userId: true,
                admin: true,
                title: true,
                group: {
                    select: {
                        class: { select: { level: true } },
                    },
                },
            },
        })

        if (membershipsToBump.length === 0) return { bumped: 0, deactivated: 0 }

        const userIds = membershipsToBump.map(membership => membership.userId)

        // A user already placed in a class of the current order keeps that placement.
        const placedInCurrentOrder = await prisma.membership.findMany({
            where: {
                order: currentOrder,
                userId: { in: userIds },
                group: { groupType: GroupType.CLASS },
            },
            select: { userId: true },
        })
        const alreadyPlaced = new Set(placedInCurrentOrder.map(membership => membership.userId))

        const newMemberships = membershipsToBump.flatMap(membership => {
            const level = membership.group.class?.level
            if (!level || alreadyPlaced.has(membership.userId)) return []

            const nextLevel = nextClassLevel(level)
            const nextGroupId = nextLevel === null ? undefined : groupIdByLevel.get(nextLevel)
            if (nextGroupId === undefined) return []

            return [{
                userId: membership.userId,
                groupId: nextGroupId,
                order: currentOrder,
                active: true,
                admin: membership.admin,
                title: membership.title,
            }]
        })

        const { deactivated } = await prisma.$transaction(async tx => {
            const { count } = await tx.membership.updateMany({
                where: {
                    active: true,
                    order: { lt: currentOrder },
                    group: {
                        groupType: GroupType.CLASS,
                        class: { level: { not: 'GRADUATED' } },
                    },
                },
                data: { active: false },
            })

            await tx.membership.createMany({
                data: newMemberships,
                skipDuplicates: true,
            })

            return { deactivated: count }
        })

        await invalidateManyUserSessionData(userIds)

        return { bumped: newMemberships.length, deactivated }
    }
})

/**
 * Classes are neither created nor destroyed: there is exactly one class group per `ClassLevel`, and
 * the seeder upserts them. Users move between them through `changeClassOfUser` and `bumpClasses`.
 */
export const classOperations = {
    read,
    readMany,
    readExpanded: commonGroupOperations.readExpanded,
    readMembers: commonGroupOperations.readMembers,
    changeClassOfUser,
    bumpClasses,
    migrateGroups: migration.migrateGroups,
} as const

import '@pn-server-only'
import { omegaMembershipGroupAuth } from './auth'
import { omegaMembershipGroupSchemas } from './schemas'
import { implementGroupType, implementStraightAwayMigration } from '@/services/groups/implementGroupType'
import { OMEGA_MEMBERSHIP_LEVEL_RANKING } from '@/services/groups/constants'
import { omegaOrderOperations } from '@/services/omegaOrder/operations'
import { defineOperation } from '@/services/serviceOperation'
import { ServerError } from '@/services/error'
import { GroupType } from '@/prisma-generated-pn-types'
import type { OmegaMembershipLevel } from '@/prisma-generated-pn-types'

function omegaMembershipGTEQ(lhs: OmegaMembershipLevel, rhs: OmegaMembershipLevel) {
    return OMEGA_MEMBERSHIP_LEVEL_RANKING.indexOf(lhs) >= OMEGA_MEMBERSHIP_LEVEL_RANKING.indexOf(rhs)
}

const commonGroupOperations = implementGroupType({
    type: GroupType.OMEGA_MEMBERSHIP_GROUP,
    auth: {
        readExpanded: omegaMembershipGroupAuth.readExpanded.dynamicFields({}),
        readMembers: () => omegaMembershipGroupAuth.readMembers.dynamicFields({}),
    },
})

const migration = implementStraightAwayMigration({
    type: GroupType.OMEGA_MEMBERSHIP_GROUP,
    auth: {
        migrateGroups: omegaMembershipGroupAuth.migrateGroups.dynamicFields({}),
    },
})

const readMany = defineOperation({
    authorizer: () => omegaMembershipGroupAuth.readMany.dynamicFields({}),
    operation: async ({ prisma }) => prisma.omegaMembershipGroup.findMany()
})

const read = defineOperation({
    paramsSchema: omegaMembershipGroupSchemas.read,
    authorizer: () => omegaMembershipGroupAuth.read.dynamicFields({}),
    operation: async ({ prisma, params }) => prisma.omegaMembershipGroup.findUniqueOrThrow({
        where: params,
    })
})

/**
 * The omega membership level of a user, i.e. which omega membership group they hold an active
 * membership in.
 * @throws INVALID CONFIGURATION if the user does not have exactly one active omega membership.
 */
const readUserLevel = defineOperation({
    paramsSchema: omegaMembershipGroupSchemas.readUserLevel,
    authorizer: () => omegaMembershipGroupAuth.readUserLevel.dynamicFields({}),
    operation: async ({ prisma, params }): Promise<OmegaMembershipLevel> => {
        const omegaMembershipGroups = await prisma.omegaMembershipGroup.findMany({
            select: {
                groupId: true,
                omegaMembershipLevel: true,
            }
        })

        const memberships = await prisma.membership.findMany({
            where: {
                userId: params.userId,
                groupId: {
                    in: omegaMembershipGroups.map(group => group.groupId),
                },
                active: true,
            }
        })

        if (memberships.length !== 1) {
            throw new ServerError(
                'INVALID CONFIGURATION',
                `The user with id ${params.userId} don't have any omega membership relation`
            )
        }

        const omegaMembershipGroup = omegaMembershipGroups.find(
            group => group.groupId === memberships[0].groupId
        )
        if (!omegaMembershipGroup) {
            throw new ServerError(
                'UNKNOWN ERROR',
                'The user has a omega membership to a group that does not exist.'
            )
        }
        return omegaMembershipGroup.omegaMembershipLevel
    }
})

/**
 * Moves the user into the omega membership group of the given level, dropping any other omega
 * membership. This is the only way an omega membership changes - the admission system drives it.
 */
const updateUserLevel = defineOperation({
    paramsSchema: omegaMembershipGroupSchemas.updateUserLevel,
    authorizer: () => omegaMembershipGroupAuth.updateUserLevel.dynamicFields({}),
    opensTransaction: true,
    operation: async ({ prisma, params }) => {
        const group = await read({
            params: { omegaMembershipLevel: params.omegaMembershipLevel },
            bypassAuth: true,
        })

        if (params.onlyUpgrade) {
            try {
                const currentLevel = await readUserLevel({
                    params: { userId: params.userId },
                    bypassAuth: true,
                })

                if (omegaMembershipGTEQ(currentLevel, params.omegaMembershipLevel)) {
                    return
                }
            } catch (error) {
                if (!(error instanceof ServerError && error.errorCode === 'INVALID CONFIGURATION')) {
                    throw error
                }
            }
        }

        const currentOmegaOrder = await omegaOrderOperations.readCurrent({ bypassAuth: true })

        await prisma.$transaction([
            prisma.membership.deleteMany({
                where: {
                    userId: params.userId,
                    group: {
                        groupType: GroupType.OMEGA_MEMBERSHIP_GROUP,
                    },
                }
            }),
            prisma.membership.create({
                data: {
                    active: true,
                    user: {
                        connect: { id: params.userId },
                    },
                    group: {
                        connect: { id: group.groupId },
                    },
                    admin: false,
                    omegaOrder: {
                        connect: { order: currentOmegaOrder.order },
                    },
                }
            })
        ])
    }
})

/**
 * Omega membership groups are neither created nor destroyed: there is one per `OmegaMembershipLevel`
 * and they always have to exist.
 */
export const omegaMembershipGroupOperations = {
    read,
    readMany,
    readUserLevel,
    updateUserLevel,
    readExpanded: commonGroupOperations.readExpanded,
    readMembers: commonGroupOperations.readMembers,
    migrateGroups: migration.migrateGroups,
} as const

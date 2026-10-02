import '@pn-server-only'
import { manualGroupAuth } from './auth'
import { manualGroupSchemas } from './schemas'
import {
    implementGroupType,
    implementManualMigrationPerGroup,
    implementSimpleAddRemoveMembersOperation,
} from '@/services/groups/implementGroupType'
import { omegaOrderOperations } from '@/services/omegaOrder/operations'
import { defineOperation } from '@/services/serviceOperation'
import { ServerError } from '@/services/error'
import type { PrismaPossibleTransaction } from '@/services/serviceOperation'
import { GroupType } from '@/prisma-generated-pn-types'
import { z } from 'zod'

const commonGroupOperations = implementGroupType({
    type: GroupType.MANUAL_GROUP,
    auth: {
        readExpanded: manualGroupAuth.readExpanded.dynamicFields({}),
        readMembers: ({ groupId }) => manualGroupAuth.readMembers.dynamicFields({ groupId }),
        readMembershipsOfUser: ({ userId }) => manualGroupAuth.readMembershipsOfUser.dynamicFields({ userId }),
    },
})

const memberManagement = implementSimpleAddRemoveMembersOperation({
    type: GroupType.MANUAL_GROUP,
    auth: {
        addMembers: ({ groupId }) => manualGroupAuth.addMembers.dynamicFields({ groupId }),
        removeMembers: ({ groupId }) => manualGroupAuth.removeMembers.dynamicFields({ groupId }),
        setMemberAdmin: ({ groupId }) => manualGroupAuth.setMemberAdmin.dynamicFields({ groupId }),
        setMemberTitle: ({ groupId }) => manualGroupAuth.setMemberTitle.dynamicFields({ groupId }),
    },
})

const migration = implementManualMigrationPerGroup({
    type: GroupType.MANUAL_GROUP,
    auth: {
        migrateGroup: ({ groupId }) => manualGroupAuth.migrateGroup.dynamicFields({ groupId }),
        pension: () => manualGroupAuth.pension.dynamicFields({}),
    },
    setPensioned: (prisma, groupId, pensioned) => prisma.manualGroup.update({
        where: { groupId },
        data: { pensioned },
    }),
})

const create = defineOperation({
    dataSchema: manualGroupSchemas.create,
    authorizer: () => manualGroupAuth.create.dynamicFields({}),
    operation: async ({ prisma, data }) => {
        const { order } = await omegaOrderOperations.readCurrent({ bypassAuth: true })

        return prisma.manualGroup.create({
            data: {
                ...data,
                group: {
                    create: {
                        groupType: GroupType.MANUAL_GROUP,
                        order,
                    }
                }
            },
        })
    }
})

const readMany = defineOperation({
    authorizer: () => manualGroupAuth.readMany.dynamicFields({}),
    operation: async ({ prisma }) => prisma.manualGroup.findMany()
})

const read = defineOperation({
    paramsSchema: z.object({
        id: z.number(),
    }),
    authorizer: () => manualGroupAuth.read.dynamicFields({}),
    operation: async ({ prisma, params }) => prisma.manualGroup.findUniqueOrThrow({
        where: { id: params.id },
    })
})

/**
 * A pensioned group is history: nothing about it may be changed until someone brings it back.
 */
async function assertNotPensioned(prisma: PrismaPossibleTransaction<false>, id: number) {
    const manualGroup = await prisma.manualGroup.findUniqueOrThrow({
        where: { id },
        select: { name: true, pensioned: true },
    })

    if (manualGroup.pensioned) {
        throw new ServerError(
            'BAD PARAMETERS',
            `${manualGroup.name} er pensjonert og kan ikke endres. Gjenopprett gruppen først.`
        )
    }
}

const update = defineOperation({
    paramsSchema: z.object({
        id: z.number(),
    }),
    dataSchema: manualGroupSchemas.update,
    authorizer: () => manualGroupAuth.update.dynamicFields({}),
    operation: async ({ prisma, params, data }) => {
        await assertNotPensioned(prisma, params.id)

        return prisma.manualGroup.update({
            where: { id: params.id },
            data,
        })
    }
})

const destroy = defineOperation({
    paramsSchema: z.object({
        id: z.number(),
    }),
    authorizer: () => manualGroupAuth.destroy.dynamicFields({}),
    opensTransaction: true,
    operation: async ({ prisma, params }) => {
        await assertNotPensioned(prisma, params.id)

        return prisma.$transaction(async tx => {
            const manualGroup = await tx.manualGroup.delete({
                where: { id: params.id },
            })
            await tx.group.delete({
                where: { id: manualGroup.groupId },
            })
            return manualGroup
        })
    }
})

export const manualGroupOperations = {
    create,
    read,
    readMany,
    update,
    destroy,
    readExpanded: commonGroupOperations.readExpanded,
    readMembers: commonGroupOperations.readMembers,
    readMembershipsOfUser: commonGroupOperations.readMembershipsOfUser,
    addMembers: memberManagement.addMembers,
    removeMembers: memberManagement.removeMembers,
    setMemberAdmin: memberManagement.setMemberAdmin,
    setMemberTitle: memberManagement.setMemberTitle,
    migrateGroup: migration.migrateGroup,
    pension: migration.pension,
} as const

import '@pn-server-only'
import { studyProgrammeAuth } from './auth'
import { studyProgrammeSchemas } from './schemas'
import {
    implementGroupType,
    implementSimpleAddRemoveMembersOperation,
    implementStraightAwayMigration,
} from '@/services/groups/implementGroupType'
import { omegaOrderOperations } from '@/services/omegaOrder/operations'
import { defineOperation } from '@/services/serviceOperation'
import { GroupType } from '@/prisma-generated-pn-types'
import { z } from 'zod'

const commonGroupOperations = implementGroupType({
    type: GroupType.STUDY_PROGRAMME,
    auth: {
        readExpanded: studyProgrammeAuth.readExpanded.dynamicFields({}),
        readMembers: () => studyProgrammeAuth.readMembers.dynamicFields({}),
    },
})

/**
 * Study programme membership follows what Feide reports about a user - see
 * `updateUserStudyProgrammes` - rather than someone picking members by hand. These are therefore
 * deliberately NOT exposed as actions in `./actions`: nothing client-callable should be able to put
 * a user in a study programme.
 */
const memberManagement = implementSimpleAddRemoveMembersOperation({
    type: GroupType.STUDY_PROGRAMME,
    auth: {
        addMembers: ({ groupId }) => studyProgrammeAuth.addMembers.dynamicFields({ groupId }),
        removeMembers: ({ groupId }) => studyProgrammeAuth.removeMembers.dynamicFields({ groupId }),
        setMemberAdmin: ({ groupId }) => studyProgrammeAuth.setMemberAdmin.dynamicFields({ groupId }),
        setMemberTitle: ({ groupId }) => studyProgrammeAuth.setMemberTitle.dynamicFields({ groupId }),
    },
})

const migration = implementStraightAwayMigration({
    type: GroupType.STUDY_PROGRAMME,
    auth: {
        migrateGroups: studyProgrammeAuth.migrateGroups.dynamicFields({}),
    },
})

const create = defineOperation({
    dataSchema: studyProgrammeSchemas.create,
    authorizer: () => studyProgrammeAuth.create.dynamicFields({}),
    operation: async ({ prisma, data }) => {
        const { order } = await omegaOrderOperations.readCurrent({ bypassAuth: true })

        return prisma.studyProgramme.create({
            data: {
                ...data,
                group: {
                    create: {
                        groupType: GroupType.STUDY_PROGRAMME,
                        order,
                    }
                }
            }
        })
    }
})

/**
 * Creates the study programmes (identified by code) that do not exist yet and returns all the given
 * ones as they are stored. Used when Feide tells us which programmes a user belongs to.
 */
const upsertMany = defineOperation({
    dataSchema: studyProgrammeSchemas.upsertMany,
    authorizer: () => studyProgrammeAuth.upsertMany.dynamicFields({}),
    opensTransaction: true,
    operation: async ({ prisma, data }) => {
        if (data.studyProgrammes.length === 0) return []

        const existing = await prisma.studyProgramme.findMany({
            where: {
                code: {
                    in: data.studyProgrammes.map(studyProgramme => studyProgramme.code),
                },
            },
        })

        const existingCodes = new Set(existing.map(studyProgramme => studyProgramme.code))
        const missing = data.studyProgrammes.filter(
            studyProgramme => !existingCodes.has(studyProgramme.code)
        )

        if (missing.length === 0) return existing

        const { order } = await omegaOrderOperations.readCurrent({ bypassAuth: true })

        const created = await prisma.$transaction(
            missing.map(studyProgramme => prisma.studyProgramme.create({
                data: {
                    ...studyProgramme,
                    group: {
                        create: {
                            groupType: GroupType.STUDY_PROGRAMME,
                            order,
                        },
                    },
                },
            }))
        )

        return existing.concat(created)
    }
})

const readMany = defineOperation({
    authorizer: () => studyProgrammeAuth.readMany.dynamicFields({}),
    operation: async ({ prisma }) => prisma.studyProgramme.findMany()
})

const read = defineOperation({
    paramsSchema: z.object({
        id: z.number(),
    }),
    authorizer: () => studyProgrammeAuth.read.dynamicFields({}),
    operation: async ({ prisma, params }) => prisma.studyProgramme.findUniqueOrThrow({
        where: { id: params.id },
    })
})

const update = defineOperation({
    paramsSchema: z.object({
        id: z.number(),
    }),
    dataSchema: studyProgrammeSchemas.update,
    authorizer: () => studyProgrammeAuth.update.dynamicFields({}),
    operation: async ({ prisma, params, data }) => prisma.studyProgramme.update({
        where: { id: params.id },
        data,
    })
})

const destroy = defineOperation({
    paramsSchema: z.object({
        id: z.number(),
    }),
    authorizer: () => studyProgrammeAuth.destroy.dynamicFields({}),
    opensTransaction: true,
    operation: async ({ prisma, params }) => prisma.$transaction(async tx => {
        const studyProgramme = await tx.studyProgramme.delete({
            where: { id: params.id },
        })
        await tx.group.delete({
            where: { id: studyProgramme.groupId },
        })
        return studyProgramme
    })
})

export const studyProgrammeOperations = {
    create,
    upsertMany,
    read,
    readMany,
    update,
    destroy,
    readExpanded: commonGroupOperations.readExpanded,
    readMembers: commonGroupOperations.readMembers,
    addMembers: memberManagement.addMembers,
    removeMembers: memberManagement.removeMembers,
    setMemberAdmin: memberManagement.setMemberAdmin,
    setMemberTitle: memberManagement.setMemberTitle,
    migrateGroups: migration.migrateGroups,
} as const

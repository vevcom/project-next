import '@pn-server-only'
import { interestGroupAuth } from './auth'
import { interestGroupSchemas } from './schemas'
import { omegaOrderOperations } from '@/services/omegaOrder/operations'
import { articleSectionsRealtionsIncluder } from '@/services/cms/articleSections/constants'
import { defineOperation } from '@/services/serviceOperation'
import {
    implementGroupType,
    implementManualMigrationPerGroup,
    implementSimpleAddRemoveMembersOperation,
} from '@/services/groups/implementGroupType'
import { GroupType } from '@/prisma-generated-pn-types'
import { cmsParagraphOperations } from '@/cms/paragraphs/operations'
import { implementUpdateArticleSectionOperations } from '@/cms/articleSections/implement'
import { ServerError } from '@/services/error'
import { z } from 'zod'
import type { PrismaPossibleTransaction } from '@/services/serviceOperation'

const commonGroupOperations = implementGroupType({
    type: GroupType.INTEREST_GROUP,
    auth: {
        readExpanded: interestGroupAuth.readExpanded.dynamicFields({}),
        readMembers: ({ groupId }) => interestGroupAuth.readMembers.dynamicFields({ groupId }),
        readMembershipsOfUser: ({ userId }) => interestGroupAuth.readMembershipsOfUser.dynamicFields({ userId }),
    },
})

const memberManagement = implementSimpleAddRemoveMembersOperation({
    type: GroupType.INTEREST_GROUP,
    auth: {
        addMembers: ({ groupId }) => interestGroupAuth.addMembers.dynamicFields({ groupId }),
        removeMembers: ({ groupId }) => interestGroupAuth.removeMembers.dynamicFields({ groupId }),
        setMemberAdmin: ({ groupId }) => interestGroupAuth.setMemberAdmin.dynamicFields({ groupId }),
        setMemberTitle: ({ groupId }) => interestGroupAuth.setMemberTitle.dynamicFields({ groupId }),
    },
})

const migration = implementManualMigrationPerGroup({
    type: GroupType.INTEREST_GROUP,
    auth: {
        migrateGroup: ({ groupId }) => interestGroupAuth.migrateGroup.dynamicFields({ groupId }),
        pension: () => interestGroupAuth.pension.dynamicFields({}),
    },
    setPensioned: (prisma, groupId, pensioned) => prisma.interestGroup.update({
        where: { groupId },
        data: { pensioned },
    }),
})

/**
 * A pensioned interest group is history: nothing about it may be changed until someone brings it
 * back. The check sits on every operation that writes.
 */
async function assertNotPensioned(prisma: PrismaPossibleTransaction<false>, id: number) {
    const interestGroup = await prisma.interestGroup.findUniqueOrThrow({
        where: { id },
        select: { name: true, pensioned: true },
    })

    if (interestGroup.pensioned) {
        throw new ServerError(
            'BAD PARAMETERS',
            `${interestGroup.name} er pensjonert og kan ikke endres. Gjenopprett gruppen først.`
        )
    }
}

export const interestGroupOperations = {
    readExpanded: commonGroupOperations.readExpanded,
    readMembers: commonGroupOperations.readMembers,
    readMembershipsOfUser: commonGroupOperations.readMembershipsOfUser,
    addMembers: memberManagement.addMembers,
    removeMembers: memberManagement.removeMembers,
    setMemberAdmin: memberManagement.setMemberAdmin,
    setMemberTitle: memberManagement.setMemberTitle,
    migrateGroup: migration.migrateGroup,
    pension: migration.pension,
    create: defineOperation({
        dataSchema: interestGroupSchemas.create,
        authorizer: () => interestGroupAuth.create.dynamicFields({}),
        operation: async ({ prisma, data }) => {
            const { order } = await omegaOrderOperations.readCurrent({ bypassAuth: true })

            await prisma.interestGroup.create({
                data: {
                    ...data,
                    articleSection: {
                        create: {
                            cmsImage: {},
                            cmsParagraph: {},
                            cmsLink: {},
                        }
                    },
                    group: {
                        create: {
                            groupType: 'INTEREST_GROUP',
                            order,
                        }
                    }
                }
            })
        }
    }),

    readMany: defineOperation({
        authorizer: () => interestGroupAuth.readMany.dynamicFields({}),
        operation: ({ prisma }) => prisma.interestGroup.findMany({
            include: {
                articleSection: {
                    include: articleSectionsRealtionsIncluder,
                },
            },
            orderBy: [
                { name: 'asc' },
                { id: 'asc' },
            ]
        })
    }),

    read: defineOperation({
        paramsSchema: z.object({
            id: z.number().optional(),
        }),
        authorizer: () => interestGroupAuth.read.dynamicFields({}),
        operation: async ({ prisma, params: { id } }) => await prisma.interestGroup.findUniqueOrThrow({
            where: {
                id,
            },
            include: {
                articleSection: {
                    include: articleSectionsRealtionsIncluder,
                },
            }
        })
    }),

    update: defineOperation({
        paramsSchema: z.object({
            id: z.number(),
        }),
        dataSchema: interestGroupSchemas.update,
        authorizer: async ({ prisma, params }) => {
            const { groupId } = await prisma.interestGroup.findUniqueOrThrow({
                where: { id: params.id },
                select: { groupId: true },
            })

            return interestGroupAuth.update.dynamicFields({
                groupId,
            })
        },
        operation: async ({ prisma, params: { id }, data }) => {
            await assertNotPensioned(prisma, id)

            return prisma.interestGroup.update({
                where: { id },
                data,
            })
        },
    }),

    destroy: defineOperation({
        paramsSchema: z.object({
            id: z.number(),
        }),
        authorizer: () => interestGroupAuth.destroy.dynamicFields({}),
        opensTransaction: true,
        operation: async ({ prisma, params: { id } }) => {
            await assertNotPensioned(prisma, id)

            await prisma.$transaction(async tx => {
                const intrestGroup = await tx.interestGroup.delete({
                    where: { id }
                })
                await tx.group.delete({
                    where: { id: intrestGroup.groupId }
                })
            })
        }
    }),

    readSpecialCmsParagraphGeneralInfo: cmsParagraphOperations.readSpecial.implement({
        authorizer: () => interestGroupAuth.readSpecialCmsParagraphGeneralInfo.dynamicFields({}),
        ownershipCheck: ({ params }) => params.special === 'INTEREST_GROUP_GENERAL_INFO'
    }),

    updateSpecialCmsParagraphContentGeneralInfo: cmsParagraphOperations.updateContent.implement({
        authorizer: () => interestGroupAuth.updateSpecialCmsParagraphContentGeneralInfo.dynamicFields({}),
        ownershipCheck: async ({ params }) =>
            await cmsParagraphOperations.isSpecial.internalCall({
                params: {
                    paragraphId: params.paragraphId,
                    special: ['INTEREST_GROUP_GENERAL_INFO']
                }
            })
    }),
    updateArticleSection: implementUpdateArticleSectionOperations({
        implementationParamsSchema: z.object({
            interestGroupId: z.number()
        }),
        authorizer: async ({ implementationParams, prisma }) => {
            const { groupId } = await prisma.interestGroup.findUniqueOrThrow({
                where: { id: implementationParams.interestGroupId },
                select: { groupId: true }
            })
            return interestGroupAuth.updateArticleSection.dynamicFields({
                groupId
            })
        },
        beforeRun: ({ prisma, implementationParams }) =>
            assertNotPensioned(prisma, implementationParams.interestGroupId),
        ownedArticleSections: ({ prisma, implementationParams }) =>
            prisma.interestGroup.findUniqueOrThrow({
                where: { id: implementationParams.interestGroupId },
                include: {
                    articleSection: {
                        include: {
                            cmsImage: true,
                            cmsParagraph: true,
                            cmsLink: true
                        }
                    }
                }
            }).then(articleGroup => [articleGroup.articleSection]),
        destroyOnEmpty: false,
    }),
}

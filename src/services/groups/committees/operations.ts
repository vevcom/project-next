import '@pn-server-only'
import { committeeAuth } from './auth'
import { committeeExpandedIncluder, committeeLogoIncluder } from './constants'
import { committeeSchemas } from './schemas'
import { committeeLogoImageOperations } from './committeeLogoCollection'
import { cmsParagraphOperations } from '@/cms/paragraphs/operations'
import { defineOperation } from '@/services/serviceOperation'
import {
    implementGroupType,
    implementManualMigrationPerGroup,
    implementSimpleAddRemoveMembersOperation,
} from '@/services/groups/implementGroupType'
import { articleRealtionsIncluder } from '@/cms/articles/constants'
import { implementUpdateArticleOperations } from '@/cms/articles/implement'
import { articleOperations } from '@/cms/articles/operations'
import { standardImageCollectionOperations } from '@/services/images/standard/operations'
import { omegaOrderOperations } from '@/services/omegaOrder/operations'
import { ServerError } from '@/services/error'
import { GroupType } from '@/prisma-generated-pn-types'
import type { PrismaPossibleTransaction } from '@/services/serviceOperation'
import type { Prisma } from '@/prisma-generated-pn-types'
import { expandedImageIncluder } from '@/services/images/subservice/constants'
import { z } from 'zod'

async function readDefaultCommitteeLogo() {
    return standardImageCollectionOperations.readStandardImage({
        params: { standardImage: 'DEFAULT_COMMITTEE_LOGO' },
    })
}

const readAll = defineOperation({
    authorizer: () => committeeAuth.readAll.dynamicFields({}),
    operation: async ({ prisma }) => {
        const defaultCommitteeLogo = await readDefaultCommitteeLogo()

        const committees = await prisma.committee.findMany({
            include: committeeLogoIncluder,
        })

        return committees.map(committee => ({
            ...committee,
            logoImage: committee.logoImage ?? defaultCommitteeLogo
        }))
    }
})

const read = defineOperation({
    authorizer: () => committeeAuth.read.dynamicFields({}),
    paramsSchema: z.union([
        z.object({ id: z.number() }),
        z.object({ shortName: z.string() })
    ]),
    operation: async ({ prisma, params }) => {
        const defaultProfileImage = await standardImageCollectionOperations.readStandardImage({
            params: { standardImage: 'DEFAULT_PROFILE_IMAGE' },
        })
        const defaultCommitteeLogo = await readDefaultCommitteeLogo()

        const result = await prisma.committee.findUniqueOrThrow({
            where: params,
            include: committeeExpandedIncluder,
        })

        return {
            ...result,
            logoImage: result.logoImage ?? defaultCommitteeLogo,
            coverImage: result.committeeArticle.coverImage,
            group: {
                ...result.group,
                memberships: result.group.memberships.map(membership => ({
                    ...membership,
                    user: {
                        ...membership.user,
                        image: membership.user.image ?? defaultProfileImage
                    }
                }))
            }
        }
    }
})

const readArticle = defineOperation({
    authorizer: () => committeeAuth.readArticle.dynamicFields({}),
    paramsSchema: z.object({
        shortName: z.string(),
    }),
    operation: async ({ prisma, params }) => (await prisma.committee.findUniqueOrThrow({
        where: params,
        select: {
            committeeArticle: {
                include: articleRealtionsIncluder,
            }
        }
    })).committeeArticle
})

const readParagraph = defineOperation({
    authorizer: () => committeeAuth.readParagraph.dynamicFields({}),
    paramsSchema: z.object({
        shortName: z.string(),
    }),
    operation: async ({ prisma, params }) => (await prisma.committee.findUniqueOrThrow({
        where: params,
        select: {
            paragraph: true,
        }
    })).paragraph
})

/**
 * A pensioned committee is history: nothing about it may be changed until someone brings it back.
 * The check sits on every operation that writes, so the rule holds however the operation is reached.
 */
async function assertNotPensioned(
    prisma: PrismaPossibleTransaction<false>,
    where: Prisma.CommitteeWhereUniqueInput,
) {
    const committee = await prisma.committee.findUniqueOrThrow({
        where,
        select: { name: true, pensioned: true },
    })

    if (committee.pensioned) {
        throw new ServerError(
            'BAD PARAMETERS',
            `${committee.name} er pensjonert og kan ikke endres. Gjenopprett komiteen først.`
        )
    }
}

const updateParagraphContent = cmsParagraphOperations.updateContent.implement({
    implementationParamsSchema: z.object({
        shortName: z.string(),
    }),
    authorizer: async ({ implementationParams }) =>
        committeeAuth.updateParagraphContent.dynamicFields({
            groupId: (await read({
                params: { shortName: implementationParams.shortName },
                bypassAuth: true
            })).groupId
        }),
    ownershipCheck: async ({ implementationParams, params }) =>
        (await readParagraph({
            params: { shortName: implementationParams.shortName },
            bypassAuth: true
        })).id === params.paragraphId,
    beforeRun: ({ prisma, implementationParams }) =>
        assertNotPensioned(prisma, { shortName: implementationParams.shortName }),
})

const updateLogo = defineOperation({
    authorizer: async ({ params }) =>
        committeeAuth.updateLogo.dynamicFields({
            groupId: (await read({
                params: { shortName: params.shortName },
                bypassAuth: true
            })).groupId
        }),
    paramsSchema: z.object({
        shortName: z.string(),
    }),
    dataSchema: committeeSchemas.updateLogo,
    opensTransaction: true,
    operation: async ({ prisma, params, data }) => {
        await assertNotPensioned(prisma, { shortName: params.shortName })

        const { image: newImage, cleanup } = await prisma.$transaction(async tx => {
            const existingCommittee = await tx.committee.findUniqueOrThrow({
                where: { shortName: params.shortName },
            })

            const uploadedImage =
                await committeeLogoImageOperations.uploadImage.internalCall({ prisma: tx, data })

            await tx.committee.update({
                where: { id: existingCommittee.id },
                data: {
                    logoImage: {
                        connect: { id: uploadedImage.id }
                    }
                }
            })

            // A previous logoImageId is always an upload owned 1:1 by this committee (never the
            // shared default, since that's only ever resolved at read time) - safe to destroy.
            const fileCleanup = existingCommittee.logoImageId
                ? await committeeLogoImageOperations.destroyImageDbAndReturnCleanup.internalCall({
                    prisma: tx,
                    params: { imageId: existingCommittee.logoImageId }
                })
                : async () => {}

            return { image: uploadedImage, cleanup: fileCleanup }
        })
        await cleanup()
        return newImage
    }
})

const destroy = defineOperation({
    authorizer: () => committeeAuth.destroy.dynamicFields({}),
    paramsSchema: z.object({
        id: z.number()
    }),
    operation: async ({ prisma, params }) => {
        await assertNotPensioned(prisma, { id: params.id })

        const committee = await prisma.committee.delete({
            where: {
                id: params.id,
            },
        })
        await articleOperations.destroy.internalCall({ params: { articleId: committee.committeeArticleId } })

        if (committee.logoImageId) {
            await committeeLogoImageOperations.destroyImage.internalCall({
                params: { imageId: committee.logoImageId }
            })
        }

        return committee
    }
})

const create = defineOperation({
    authorizer: () => committeeAuth.create.dynamicFields({}),
    dataSchema: committeeSchemas.create,
    opensTransaction: true,
    operation: ({ prisma, data }) =>
        prisma.$transaction(async tx => {
            const logoImage = data.imageFile
                ? await committeeLogoImageOperations.uploadImage.internalCall({
                    prisma: tx,
                    data: {
                        imageFile: data.imageFile,
                        imageAlt: data.imageAlt || `Komitélogoen til ${data.name}`,
                        imageName: data.imageName,
                        imageLicenseId: data.imageLicenseId,
                        imageCredit: data.imageCredit,
                    }
                })
                : null

            const article = await articleOperations.create.internalCall({
                prisma: tx,
                data: {},
                dataSchemaImplementationFields: { maxNameLength: 30 },
                operationImplementationFields: { special: null }
            })

            const paragraph = await cmsParagraphOperations.create.internalCall({
                prisma: tx,
                data: { name: `Paragraph for ${data.name}` },
                operationImplementationFields: { special: null }
            })
            const applicationParagraph = await cmsParagraphOperations.create.internalCall({
                prisma: tx,
                data: { name: `Søknadstekst for ${data.name}` },
                operationImplementationFields: { special: null }
            })

            const order = (await omegaOrderOperations.readCurrent({ bypassAuth: true })).order

            return await tx.committee.create({
                data: {
                    name: data.name,
                    shortName: data.shortName,
                    logoImage: logoImage ? {
                        connect: {
                            id: logoImage.id,
                        },
                    } : undefined,
                    paragraph: {
                        connect: {
                            id: paragraph.id,
                        }
                    },
                    group: {
                        create: {
                            groupType: GroupType.COMMITTEE,
                            order,
                        }
                    },
                    committeeArticle: {
                        connect: {
                            id: article.id
                        }
                    },
                    applicationParagraph: {
                        connect: {
                            id: applicationParagraph.id
                        }
                    }
                },
                include: {
                    logoImage: { include: expandedImageIncluder },
                },
            })
        })
})

const update = defineOperation({
    authorizer: () => committeeAuth.update.dynamicFields({}),
    paramsSchema: z.object({
        id: z.number()
    }),
    dataSchema: committeeSchemas.update,
    operation: async ({ prisma, params, data }) => {
        await assertNotPensioned(prisma, { id: params.id })
        const defaultCommitteeLogo = await readDefaultCommitteeLogo()

        const committee = await prisma.committee.update({
            where: {
                id: params.id,
            },
            data,
            include: {
                logoImage: { include: expandedImageIncluder },
            },
        })

        return {
            ...committee,
            logoImage: committee.logoImage ?? defaultCommitteeLogo
        }
    }
})

const updateArticle = implementUpdateArticleOperations({
    authorizer: async ({ implementationParams }) => committeeAuth.updateArticle.dynamicFields({
        groupId: (await read({
            params: { shortName: implementationParams.shortName },
            bypassAuth: true
        })).groupId
    }),
    implementationParamsSchema: z.object({
        shortName: z.string(),
    }),
    ownedArticles: async ({ implementationParams }) => {
        const article = await readArticle({ params: { shortName: implementationParams.shortName }, bypassAuth: true })
        return [article]
    },
    beforeRun: ({ prisma, implementationParams }) =>
        assertNotPensioned(prisma, { shortName: implementationParams.shortName }),
})

const commonGroupOperations = implementGroupType({
    type: GroupType.COMMITTEE,
    auth: {
        readExpanded: committeeAuth.readExpanded.dynamicFields({}),
        readMembers: () => committeeAuth.readMembers.dynamicFields({}),
    },
})

const memberManagement = implementSimpleAddRemoveMembersOperation({
    type: GroupType.COMMITTEE,
    auth: {
        addMembers: ({ groupId }) => committeeAuth.addMembers.dynamicFields({ groupId }),
        removeMembers: ({ groupId }) => committeeAuth.removeMembers.dynamicFields({ groupId }),
        setMemberAdmin: ({ groupId }) => committeeAuth.setMemberAdmin.dynamicFields({ groupId }),
        setMemberTitle: ({ groupId }) => committeeAuth.setMemberTitle.dynamicFields({ groupId }),
    },
})

const migration = implementManualMigrationPerGroup({
    type: GroupType.COMMITTEE,
    auth: {
        migrateGroup: ({ groupId }) => committeeAuth.migrateGroup.dynamicFields({ groupId }),
        pension: () => committeeAuth.pension.dynamicFields({}),
    },
    setPensioned: (prisma, groupId, pensioned) => prisma.committee.update({
        where: { groupId },
        data: { pensioned },
    }),
})

export const committeeOperations = {
    create,
    update,
    updateLogo,
    readAll,
    read,
    readExpanded: commonGroupOperations.readExpanded,
    readMembers: commonGroupOperations.readMembers,
    addMembers: memberManagement.addMembers,
    removeMembers: memberManagement.removeMembers,
    setMemberAdmin: memberManagement.setMemberAdmin,
    setMemberTitle: memberManagement.setMemberTitle,
    migrateGroup: migration.migrateGroup,
    pension: migration.pension,
    readArticle,
    readParagraph,
    updateParagraphContent,
    destroy,
    updateArticle,
} as const

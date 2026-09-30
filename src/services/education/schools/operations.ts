import '@pn-server-only'
import { schoolAuth } from './auth'
import { schoolSchemas } from './schemas'
import { SchoolFilteredSelection, SchoolRelationIncluder, StandardSchoolsConfig } from './constants'
import { cmsParagraphOperations } from '@/cms/paragraphs/operations'
import { cmsImageOperations } from '@/cms/images/operations'
import { cmsLinkOperations } from '@/cms/links/operations'
import { defineOperation } from '@/services/serviceOperation'
import { cursorPageingSelection } from '@/lib/paging/cursorPageingSelection'
import { ServiceError } from '@/services/error'
import logger from '@/lib/logger'
import { StandardSchool } from '@/prisma-generated-pn-types'
import { z } from 'zod'

const read = defineOperation({
    authorizer: () => schoolAuth.read.dynamicFields({}),
    paramsSchema: z.object({
        shortName: z.string()
    }),
    operation: ({ params, prisma }) =>
        prisma.school.findUniqueOrThrow({
            where: {
                shortName: params.shortName
            },
            select: {
                ...SchoolFilteredSelection,
                ...SchoolRelationIncluder,
            },
        })
})

const create = defineOperation({
    authorizer: () => schoolAuth.create.dynamicFields({}),
    dataSchema: schoolSchemas.create,
    operation: async ({ prisma, data }) => {
        const cmsImage = await cmsImageOperations.create.internalCall({
            data: {},
            operationImplementationFields: { special: null }
        })
        const cmsParagraph = await cmsParagraphOperations.create.internalCall({
            data: {},
            operationImplementationFields: { special: null }
        })
        const cmsLink = await cmsLinkOperations.create.internalCall({
            data: { text: 'link', url: './' },
            operationImplementationFields: { special: null }
        })

        return prisma.school.create({
            data: {
                name: data.name,
                shortName: data.shortName,
                standardSchool: data.standardSchool,
                cmsImage: {
                    connect: {
                        id: cmsImage.id
                    }
                },
                cmsParagraph: {
                    connect: {
                        id: cmsParagraph.id
                    }
                },
                cmsLink: {
                    connect: {
                        id: cmsLink.id
                    }
                },
            },
            select: SchoolFilteredSelection,
        })
    }
})

const createStandard = defineOperation({
    authorizer: () => schoolAuth.createStandard.dynamicFields({}),
    paramsSchema: z.object({
        standardSchool: z.nativeEnum(StandardSchool)
    }),
    operation: ({ params }) =>
        // Called only internally by readStandard to lazily seed missing standard schools, so it
        // bypasses the SCHOOLS_ADMIN authorizer while inheriting the ambient prisma/session.
        create({
            data: {
                ...StandardSchoolsConfig[params.standardSchool],
                standardSchool: params.standardSchool,
            },
            bypassAuth: true,
        })
})

const updateCmsParagraphContent = cmsParagraphOperations.updateContent.implement({
    authorizer: () => schoolAuth.updateCmsParagraphContent.dynamicFields({}),
    implementationParamsSchema: z.object({
        shortName: z.string()
    }),
    ownershipCheck: async ({ params, implementationParams }) => {
        const school = await read({ params: implementationParams })
        return school.cmsParagraph.id === params.paragraphId
    }
})

const updateCmsImage = cmsImageOperations.update.implement({
    authorizer: () => schoolAuth.updateCmsImage.dynamicFields({}),
    implementationParamsSchema: z.object({
        shortName: z.string()
    }),
    ownershipCheck: async ({ params, implementationParams }) => {
        const school = await read({ params: implementationParams })
        return school.cmsImage.id === params.cmsImageId
    }
})

const updateCmsLink = cmsLinkOperations.update.implement({
    authorizer: () => schoolAuth.updateCmsLink.dynamicFields({}),
    implementationParamsSchema: z.object({
        shortName: z.string()
    }),
    ownershipCheck: async ({ params, implementationParams }) => {
        const school = await read({ params: implementationParams })
        return school.cmsLink.id === params.linkId
    }
})

export const schoolOperations = {
    read,
    create,
    createStandard,
    destroy: defineOperation({
        authorizer: () => schoolAuth.destroy.dynamicFields({}),
        paramsSchema: z.object({
            id: z.number()
        }),
        operation: async ({ prisma, params }) => {
            const school = await prisma.school.findUniqueOrThrow({
                where: { id: params.id },
                select: { standardSchool: true },
            })
            if (school.standardSchool) throw new ServiceError('BAD PARAMETERS', 'Kan ikke slette standard skole')
            await prisma.school.delete({ where: { id: params.id } })
        }
    }),
    readExpandedPage: defineOperation({
        authorizer: () => schoolAuth.readExpandedPage.dynamicFields({}),
        paramsSchema: schoolSchemas.readPage,
        operation: ({ prisma, params }) =>
            prisma.school.findMany({
                select: {
                    ...SchoolFilteredSelection,
                    ...SchoolRelationIncluder,
                },
                orderBy: [
                    { standardSchool: 'asc' },
                    { shortName: 'asc' },
                    { id: 'asc' },
                ],
                ...cursorPageingSelection(params.paging.page),
            })
    }),
    readStandard: defineOperation({
        authorizer: () => schoolAuth.readStandard.dynamicFields({}),
        operation: ({ prisma }) =>
            Promise.all(Object.values(StandardSchool).map(async standardSchool => {
                const school = await prisma.school.findUnique({
                    where: { standardSchool },
                    select: SchoolFilteredSelection,
                })
                if (!school) {
                    logger.warn(`Standard school ${standardSchool} not found in database - creating....`)
                    return createStandard({ params: { standardSchool }, bypassAuth: true })
                }
                return school
            }))
    }),
    readMany: defineOperation({
        authorizer: () => schoolAuth.readMany.dynamicFields({}),
        paramsSchema: schoolSchemas.readMany,
        operation: ({ prisma, params }) =>
            prisma.school.findMany({
                where: params.onlyNonStandard ? {
                    standardSchool: null,
                } : undefined,
                select: SchoolFilteredSelection,
            })
    }),
    update: defineOperation({
        authorizer: () => schoolAuth.update.dynamicFields({}),
        paramsSchema: z.object({
            id: z.number()
        }),
        dataSchema: schoolSchemas.update,
        operation: ({ prisma, params, data }) =>
            prisma.school.update({
                where: { id: params.id },
                data,
                select: SchoolFilteredSelection,
            })
    }),
    updateCmsParagraphContent,
    updateCmsImage,
    updateCmsLink,
} as const

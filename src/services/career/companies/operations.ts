import '@pn-server-only'
import { companyAuth } from './auth'
import { companySponsorOrdering, logoIncluder } from './constants'
import { companySchemas } from './schemas'
import { defineOperation } from '@/services/serviceOperation'
import { cursorPageingSelection } from '@/lib/paging/cursorPageingSelection'
import { cmsImageOperations } from '@/cms/images/operations'
import { CompanySponsorTier } from '@/prisma-generated-pn-types'
import { z } from 'zod'

export const companyOperations = {
    create: defineOperation({
        dataSchema: companySchemas.create,
        authorizer: () => companyAuth.create,
        operation: async ({ prisma, data }) => {
            //TODO: tranaction when createCmsImage is service operation.
            const logo = await cmsImageOperations.create.internalCall({
                data: {},
                operationImplementationFields: { special: null }
            })
            return await prisma.company.create({
                data: {
                    ...data,
                    logoId: logo.id,
                }
            })
        }
    }),
    readPage: defineOperation({
        paramsSchema: companySchemas.readPage,
        authorizer: () => companyAuth.readPage,
        operation: async ({ prisma, params }) => await prisma.company.findMany({
            ...cursorPageingSelection(params.paging.page),
            where: {
                name: {
                    contains: params.paging.details.name,
                    mode: 'insensitive'
                }
            },
            orderBy: companySponsorOrdering,
            include: logoIncluder,
        })
    }),
    update: defineOperation({
        paramsSchema: z.object({
            id: z.number(),
        }),
        dataSchema: companySchemas.update,
        authorizer: () => companyAuth.update,
        operation: async ({ prisma, params: { id }, data }) => {
            await prisma.company.update({
                where: { id },
                data,
            })
        },
    }),
    /**
     * Moves a company between the sponsor tiers that decide how far up it - and its job ads - sit in
     * the career listings. The main tier holds a single company, so promoting a new one has to step
     * the sitting main sponsor down in the same transaction. It is demoted to the ordinary sponsor
     * tier rather than all the way out, since losing the main slot does not mean the company stopped
     * being a sponsor.
     */
    updateSponsorTier: defineOperation({
        paramsSchema: z.object({
            id: z.number(),
        }),
        dataSchema: companySchemas.updateSponsorTier,
        authorizer: () => companyAuth.updateSponsorTier,
        opensTransaction: true,
        operation: async ({ prisma, params: { id }, data: { sponsorTier } }) =>
            await prisma.$transaction(async tx => {
                if (sponsorTier === CompanySponsorTier.MAIN) {
                    await tx.company.updateMany({
                        where: {
                            sponsorTier: CompanySponsorTier.MAIN,
                            id: { not: id },
                        },
                        data: { sponsorTier: CompanySponsorTier.SPONSOR },
                    })
                }
                await tx.company.update({
                    where: { id },
                    data: { sponsorTier },
                })
            })
    }),
    updateCmsImageLogo: cmsImageOperations.update.implement({
        implementationParamsSchema: z.object({
            companyId: z.number(),
        }),
        authorizer: () => companyAuth.updateCmsImageLogo,
        ownershipCheck: async ({ implementationParams, params, prisma }) =>
            (await prisma.company.findUniqueOrThrow({
                where: { id: implementationParams.companyId },
                select: { logoId: true }
            }))?.logoId === params.cmsImageId
    }),
    destroy: defineOperation({
        paramsSchema: z.object({
            id: z.number()
        }),
        authorizer: () => companyAuth.destroy,
        operation: async ({ prisma, params: { id } }) => {
            await prisma.company.delete({
                where: {
                    id
                }
            })
        }
    }),
}

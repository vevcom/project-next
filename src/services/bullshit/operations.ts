import { bullshitAuth } from './auth'
import { bullshitSchemas } from './schemas'
import { bullshitFilterSelection } from './constants'
import { defineOperation } from '@/services/serviceOperation'
import { cursorPageingSelection } from '@/lib/paging/cursorPageingSelection'
import { z } from 'zod'

export const bullshitOperations = {
    create: defineOperation({
        authorizer: () => bullshitAuth.create.dynamicFields({}),
        dataSchema: bullshitSchemas.create,
        paramsSchema: z.object({
            bullshitAuthPosterId: z.number()
        }),
        operation: async ({ prisma, data, params }) => {
            await prisma.bullshit.create({
                data: {
                    ...data,
                    bullshitPoster: {
                        connect: {
                            id: params.bullshitAuthPosterId
                        }
                    }
                }
            })
        }
    }),
    readPage: defineOperation({
        paramsSchema: bullshitSchemas.readPage,
        authorizer: () => bullshitAuth.readPage.dynamicFields({}),
        operation: async ({ prisma, params }) =>
            prisma.bullshit.findMany({
                orderBy: {
                    timestamp: 'desc',
                },
                ...cursorPageingSelection(params.paging.page),
                select: bullshitFilterSelection,
            })
    }),
} as const

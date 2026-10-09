import '@pn-server-only'
import { feideAccountAuth } from './auth'
import { feideAccountSchemas } from './schemas'
import { defineOperation } from '@/services/serviceOperation'
import { z } from 'zod'

export const feideAccountOperations = {
    create: defineOperation({
        dataSchema: feideAccountSchemas.create,
        authorizer: () => feideAccountAuth.create,
        operation: ({ prisma, data: { userId, ...feideAccount } }) => prisma.feideAccount.create({
            data: {
                ...feideAccount,
                user: { connect: { id: userId } },
            },
        }),
    }),

    /** The user a Feide account is linked to - null when there is no account with the id. */
    readUser: defineOperation({
        paramsSchema: z.object({
            feideAccountId: z.string(),
        }),
        authorizer: () => feideAccountAuth.readUser,
        operation: async ({ prisma, params }) => {
            const feideAccount = await prisma.feideAccount.findUnique({
                where: { id: params.feideAccountId },
                select: { user: true },
            })
            return feideAccount?.user ?? null
        },
    }),

    updateEmail: defineOperation({
        paramsSchema: z.object({
            feideAccountId: z.string(),
        }),
        dataSchema: feideAccountSchemas.updateEmail,
        authorizer: () => feideAccountAuth.updateEmail,
        operation: ({ prisma, params, data }) => prisma.feideAccount.update({
            where: { id: params.feideAccountId },
            data,
        }),
    }),
} as const

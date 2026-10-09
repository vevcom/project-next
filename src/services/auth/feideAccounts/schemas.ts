import { z } from 'zod'

const baseSchema = z.object({
    id: z.string(),
    userId: z.number(),
    email: z.string().trim().toLowerCase(),
    expiresAt: z.date(),
    issuedAt: z.date(),
})

export const feideAccountSchemas = {
    create: baseSchema.pick({
        id: true,
        userId: true,
        email: true,
        expiresAt: true,
        issuedAt: true,
    }),
    updateEmail: baseSchema.pick({
        email: true,
    }),
} as const

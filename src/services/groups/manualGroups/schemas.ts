import { z } from 'zod'

const baseSchema = z.object({
    name: z.string().max(32).min(1).trim(),
    shortName: z.string().max(32).min(1).trim(),
})

export const manualGroupSchemas = {
    create: baseSchema.pick({
        name: true,
        shortName: true,
    }),
    update: baseSchema.pick({
        name: true,
        shortName: true,
    }).partial(),
} as const

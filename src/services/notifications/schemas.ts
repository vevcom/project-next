import { z } from 'zod'

export const notificationMethodSchema = z.object({
    email: z.boolean(),
    emailWeekly: z.boolean(),
})

const baseSchema = z.object({
    channelId: z.coerce.number().min(1),
    title: z.string().min(2),
    message: z.string().min(10),
    targetUserIds: z.number().array().optional(),
    visibilityId: z.number().optional(),
})

export const notificationSchemas = {
    create: baseSchema.pick({
        channelId: true,
        title: true,
        message: true,
        targetUserIds: true,
        visibilityId: true,
    }),

    createSpecial: baseSchema.pick({
        title: true,
        message: true,
        targetUserIds: true,
        visibilityId: true,
    }),
}

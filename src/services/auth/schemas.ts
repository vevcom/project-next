import { userSchema, userSchemas } from '@/services/users/schemas'
import { z } from 'zod'

export const authSchemas = {
    sendResetPasswordEmail: userSchema.pick({
        email: true,
    }),
    resetPassword: userSchemas.updatePassword,
    sendLinkFeideAccountEmail: z.object({
        usernameOrEmail: z.string().min(1),
    }),
    adminLinkFeideAccount: z.object({
        fromUsername: z.string().min(1),
        toUsername: z.string().min(1),
    }),
    /** The claims of a link Feide account token: who asked, and the Feide identity to move. */
    linkFeideAccountClaims: z.object({
        sub: z.coerce.number(),
        feideUserId: z.coerce.number(),
        feideAccountId: z.string(),
        feideName: z.string(),
        feideEmail: z.string(),
    }).transform(({ sub, ...claims }) => ({ targetUserId: sub, ...claims })),
} as const

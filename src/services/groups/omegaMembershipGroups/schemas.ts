import { OmegaMembershipLevel } from '@/prisma-generated-pn-types'
import { z } from 'zod'

export const omegaMembershipGroupSchemas = {
    read: z.union([
        z.object({ id: z.number() }),
        z.object({ omegaMembershipLevel: z.nativeEnum(OmegaMembershipLevel) }),
    ]),
    readUserLevel: z.object({
        userId: z.number(),
    }),
    updateUserLevel: z.object({
        userId: z.number(),
        omegaMembershipLevel: z.nativeEnum(OmegaMembershipLevel),
        /**
         * When set, a user who already sits at the wanted level or a higher one is left alone.
         */
        onlyUpgrade: z.boolean().default(false),
    }),
} as const

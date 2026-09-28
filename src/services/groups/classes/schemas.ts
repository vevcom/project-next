import { ClassLevel } from '@/prisma-generated-pn-types'
import { z } from 'zod'

export const classSchemas = {
    read: z.union([
        z.object({ id: z.number() }),
        z.object({ level: z.nativeEnum(ClassLevel) }),
    ]),
    readClassOfUser: z.object({
        userId: z.number(),
    }),
    changeClassOfUser: z.object({
        userId: z.coerce.number(),
        level: z.nativeEnum(ClassLevel),
        /**
         * Which order to change the user's class in. Defaults to the order the class groups are
         * currently in, which is the order a class membership is normally created in.
         */
        order: z.coerce.number().optional(),
    }),
} as const

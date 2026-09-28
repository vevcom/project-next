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
    /**
     * Who is being moved, and in which order. The order defaults to the one the class groups are
     * currently in, which is where a class membership is normally created.
     */
    changeClassOfUserParams: z.object({
        userId: z.coerce.number(),
        order: z.coerce.number().optional(),
    }),
    /** The class to move them into - what the form actually submits. */
    changeClassOfUser: z.object({
        level: z.nativeEnum(ClassLevel),
    }),
} as const

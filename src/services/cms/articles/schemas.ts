import { baseSchema as baseSchemaArticleSections } from '@/cms/articleSections/schemas'
import { z } from 'zod'

const name = (maxLength: number) => z.string()
    .min(2, 'Minimum lengde er 2 tegn.')
    .max(maxLength, `Maksimum lengde er ${maxLength} tegn.`)

const baseSchema = z.object({
    name: name(30),
    includeParts: z.record(baseSchemaArticleSections.shape.part, z.boolean()),
    direction: z.union([z.literal('UP'), z.literal('DOWN')])
})

export const articleSchemas = {
    /** The owner sets how long a name may be - a category article has less room than news. */
    create: ({ maxNameLength }: { maxNameLength: number }) => z.object({
        name: name(maxNameLength).optional(),
    }),
    update: baseSchema.pick({
        name: true,
    }).partial(),
    addSection: baseSchema.pick({
        includeParts: true
    }),
    reorderSections: baseSchema.pick({
        direction: true
    }),
    params: z.object({
        articleId: z.number()
    })
} as const

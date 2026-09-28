import { z } from 'zod'

// Text inputs arrive as strings, and an empty one means "not set" rather than 0.
const optionalIntFromForm = z.preprocess(
    value => (value === '' ? null : value),
    z.coerce.number().int().nullable().optional()
)

const optionalStringFromForm = z.preprocess(
    value => (value === '' ? null : value),
    z.string().trim().nullable().optional()
)

const booleanFromForm = z.union([
    z.boolean(),
    z.enum(['true', 'false']).transform(value => value === 'true'),
])

const baseSchema = z.object({
    name: z.string().min(1).trim(),
    code: z.string().min(1).trim(),
    insititueCode: optionalStringFromForm,
    startYear: optionalIntFromForm,
    yearsLength: optionalIntFromForm,
    partOfOmega: booleanFromForm.optional(),
})

const writableFields = {
    name: true,
    code: true,
    insititueCode: true,
    startYear: true,
    yearsLength: true,
    partOfOmega: true,
} as const

export const studyProgrammeSchemas = {
    create: baseSchema.pick(writableFields),
    update: baseSchema.pick(writableFields).partial(),
    upsertMany: z.object({
        studyProgrammes: baseSchema.pick(writableFields).array(),
    }),
} as const

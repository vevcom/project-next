import { readPageInputSchemaObject } from '@/lib/paging/schema'
import { CompanySponsorTier } from '@/prisma-generated-pn-types'
import { z } from 'zod'

const baseSchema = z.object({
    name: z.string().min(
        2, 'Navnet må være minst 3 tegn langt'
    ).max(
        100, 'Navnet kan maks være 100 tegn langt'
    ).trim(),
    description: z.string().max(
        200, 'Beskrivelsen kan maks være 200 tegn langt'
    ).trim(),
    // The form always submits the field, so the empty string has to survive and land as null.
    website: z.union([
        z.literal('').transform(() => null),
        // Rendered straight into an anchor href for anonymous visitors, and .url() accepts any
        // scheme new URL() can parse, so http(s) has to be required on top of it.
        z.string().trim()
            .url('Nettsiden må være en full URL, f.eks. https://omega.ntnu.no')
            .refine(
                website => ['http:', 'https:'].includes(new URL(website).protocol),
                'Nettsiden må starte med http:// eller https://'
            ),
    ]).nullable(),
    sponsorTier: z.nativeEnum(CompanySponsorTier, {
        errorMap: () => ({ message: 'Velg en gyldig samarbeidsgrad' }),
    }),
})

export const companySchemas = {
    create: baseSchema.pick({
        name: true,
        description: true,
    }),
    update: baseSchema.partial().pick({
        name: true,
        description: true,
        website: true,
    }),
    updateSponsorTier: baseSchema.pick({
        sponsorTier: true,
    }),
    readPage: readPageInputSchemaObject(
        z.object({
            id: z.number(),
        }),
        z.object({
            name: z.string().max(100).optional(),
        }),
    ),
}

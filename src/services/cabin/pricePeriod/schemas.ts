import { Zpn } from '@/lib/fields/zpn'
import { z } from 'zod'

const baseSchema = z.object({
    validFrom: z.coerce.date(),
    copyPreviousPrices: Zpn.checkboxOrBoolean({ label: '' }),
})

export const cabinPricePeriodSchemas = {
    create: baseSchema.pick({
        validFrom: true,
        copyPreviousPrices: true,
    }),
    update: baseSchema.pick({
        validFrom: true,
    }),
} as const

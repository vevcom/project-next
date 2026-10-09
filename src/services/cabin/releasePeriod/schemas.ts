import { dateLessThan } from '@/lib/dates/comparison'
import { z } from 'zod'

const baseSchema = z.object({
    releaseTime: z.coerce.date(),
    releaseUntil: z.coerce.date(),
})

const releasesBeforeItsEnd = (data: { releaseTime: Date, releaseUntil: Date }) =>
    dateLessThan(data.releaseTime, data.releaseUntil)
const releaseMessage = 'Slipp tiden må være før slutten av perioden som slippes.'

const releasePeriod = baseSchema.pick({
    releaseTime: true,
    releaseUntil: true,
}).refine(releasesBeforeItsEnd, releaseMessage)

export const cabinReleasePeriodSchemas = {
    create: releasePeriod,
    update: releasePeriod,
} as const

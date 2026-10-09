import { Zpn } from '@/lib/fields/zpn'
import { z } from 'zod'

const fields = z.object({
    name: z.string().trim().min(2, { message: 'Navnet må være minst 2 tegn.' }),
    startDate: Zpn.date({ label: 'Start' }),
    endDate: Zpn.date({ label: 'Siste frist for søknader' }),
    endPriorityDate: Zpn.date({ label: 'Siste frist for prioritering' }),
    participatingCommitteeIds: Zpn.numberListCheckboxFriendly({ label: 'Deltakende komiteer' })
})

/**
 * The period starts before applications close, and prioritizing closes no earlier than that.
 * Only the pairs that are both given are compared, so a partial update is judged on what it
 * changes alone - the operation compares the merged dates.
 */
export const periodDatesInOrder = ({ startDate, endDate, endPriorityDate }: {
    startDate?: Date,
    endDate?: Date,
    endPriorityDate?: Date,
}) => (
    (!startDate || !endDate || startDate < endDate)
    && (!endDate || !endPriorityDate || endDate <= endPriorityDate)
)

export const periodDatesMessage =
    'Søknadsfristen må være etter starten, og prioriteringsfristen kan ikke være før søknadsfristen.'

export const applicationPeriodSchemas = {
    create: fields.pick({
        name: true,
        startDate: true,
        endDate: true,
        endPriorityDate: true,
        participatingCommitteeIds: true
    }).refine(periodDatesInOrder, periodDatesMessage),

    update: fields.pick({
        name: true,
        startDate: true,
        endDate: true,
        endPriorityDate: true,
        participatingCommitteeIds: true
    }).partial().refine(periodDatesInOrder, periodDatesMessage),
}

import { Zpn } from '@/lib/fields/zpn'
import { z } from 'zod'

const ledgerAcccountSchema = z.object({
    // Display name for the account. Only meaningful for GROUP accounts (see LedgerAccount.name).
    name: z.string().optional(),
    groupIds: Zpn.numberListCheckboxFriendly({ label: 'Grupper' }).optional(),
    payoutAccountNumber: z.string().optional(),
    frozen: z.boolean(),
})

export const ledgerAccountSchemas = {
    create: ledgerAcccountSchema.partial().pick({
        name: true,
        groupIds: true,
        payoutAccountNumber: true,
        frozen: true,
    }),

    update: ledgerAcccountSchema.partial().pick({
        name: true,
        payoutAccountNumber: true,
        frozen: true,
    }).extend({
        addGroupIds: z.number().array().optional(),
        removeGroupIds: z.number().array().optional(),
    })
}

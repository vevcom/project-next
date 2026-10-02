import { RequirePermission } from '@/auth/authorizer/RequirePermission'
import { RequireLedgerAccountAccess } from '@/auth/authorizer/RequireLedgerAccountAccess'

// Reads are exempt from LEDGER_USE: users can always see their own accounts even if the ledger
// is otherwise disabled. Mutations require LEDGER_USE, plus ownership whenever they act on a
// specific account.
export const ledgerAccountAuth = {
    // USER accounts are created automatically alongside their User, not through this operation
    // (see operations.ts's create). A GROUP account has no owning user to fall back on, so this
    // is LEDGER_ADMIN only.
    create: RequirePermission.staticFields({ permission: 'LEDGER_ADMIN' }),

    read: RequireLedgerAccountAccess.staticFields({ permission: 'LEDGER_ADMIN' }),

    readMany: RequireLedgerAccountAccess.staticFields({ permission: 'LEDGER_ADMIN' }),

    // Browses every account with no owner filter, so this is LEDGER_ADMIN only, not exempt.
    readPage: RequirePermission.staticFields({ permission: 'LEDGER_ADMIN' }),

    // Can reassign an account's owner or payout number, so ownership is required too, even
    // though updating doesn't move money.
    update: {
        ledgerUse: RequirePermission.staticFields({ permission: 'LEDGER_USE' }),
        accountAccess: RequireLedgerAccountAccess.staticFields({ permission: 'LEDGER_ADMIN' }),
        // Group links decide who can access the account, so changing them is LEDGER_ADMIN only,
        // not covered by ownership like the rest of an update.
        groupAccess: RequirePermission.staticFields({ permission: 'LEDGER_ADMIN' }),
    },

    calculateBalances: RequireLedgerAccountAccess.staticFields({ permission: 'LEDGER_ADMIN' }),
    calculateBalance: RequireLedgerAccountAccess.staticFields({ permission: 'LEDGER_ADMIN' }),
} as const

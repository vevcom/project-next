import { ledgerAccountAccess } from './ownership'
import { Require } from '@/auth/authorizer/Require'
import type { LedgerAccountOwnership } from './ownership'

// Reads are exempt from LEDGER_USE: users can always see their own accounts even if the ledger
// is otherwise disabled. Mutations require LEDGER_USE, plus ownership whenever they act on a
// specific account.
export const ledgerAccountAuth = {
    // A USER account may be self-service created by anyone with LEDGER_USE (see readOrCreate's
    // comment). A GROUP account has no owning user to fall back on, so it's LEDGER_ADMIN only.
    create: {
        ledgerUse: Require.permission('LEDGER_USE'),
        ledgerAdmin: Require.permission('LEDGER_ADMIN'),
    },

    read: (accounts: LedgerAccountOwnership[]) => ledgerAccountAccess('LEDGER_ADMIN', accounts),

    readMany: (accounts: LedgerAccountOwnership[]) => ledgerAccountAccess('LEDGER_ADMIN', accounts),

    // Its only caller, paymentOperations.initiate, already requires LEDGER_USE, so the account
    // creation this performs stays gated even though this authorizer alone doesn't check it.
    readOrCreate: Require.permission('LEDGER_ADMIN').or().userId(),

    // Browses every account with no owner filter, so this is LEDGER_ADMIN only, not exempt.
    readPage: Require.permission('LEDGER_ADMIN'),

    // Can reassign an account's owner or payout number, so ownership is required too, even
    // though updating doesn't move money.
    //
    // Group links decide who can access the account (ledgerAccountAccess treats an owning group's
    // members as owners), so changing them takes LEDGER_ADMIN on top, even of a caller who already
    // owns the account. Require.allOf rather than chaining onto the ownership chain: chaining
    // would add LEDGER_ADMIN to its last group only.
    update: ({ accounts, changesGroupLinks }: {
        accounts: LedgerAccountOwnership[],
        changesGroupLinks: boolean,
    }) => {
        const ownAccount = Require.permission('LEDGER_USE').allOf(ledgerAccountAccess('LEDGER_ADMIN', accounts))
        return changesGroupLinks ? Require.allOf(ownAccount, Require.permission('LEDGER_ADMIN')) : ownAccount
    },

    calculateBalances: (accounts: LedgerAccountOwnership[]) => ledgerAccountAccess('LEDGER_ADMIN', accounts),
    calculateBalance: (accounts: LedgerAccountOwnership[]) => ledgerAccountAccess('LEDGER_ADMIN', accounts),
} as const

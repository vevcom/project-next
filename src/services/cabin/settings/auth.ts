import { Require } from '@/auth/authorizer/Require'

export const cabinSettingsAuth = {
    read: Require.permission('CABIN_ADMIN'),
    // The ledger account all cabin revenue goes to, so it takes LEDGER_ADMIN on top.
    update: Require.permission('CABIN_ADMIN').permission('LEDGER_ADMIN'),
} as const

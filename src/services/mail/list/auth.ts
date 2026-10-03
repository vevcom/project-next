import { Require } from '@/auth/authorizer/Require'

export const mailingListAuth = {
    create: Require.permission('MAILINGLIST_ADMIN'),
    readMany: Require.permission('MAILINGLIST_USE'),
    read: Require.permission('MAILINGLIST_USE'),
    update: Require.permission('MAILINGLIST_ADMIN'),
    destroy: Require.permission('MAILINGLIST_ADMIN'),
} as const

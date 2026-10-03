import { Require } from '@/auth/authorizer/Require'

export const mailAddressExternalAuth = {
    create: Require.permission('MAILADDRESS_EXTERNAL_ADMIN'),
    destroy: Require.permission('MAILADDRESS_EXTERNAL_ADMIN'),
    readMany: Require.permission('MAILADDRESS_EXTERNAL_USE'),
    read: Require.permission('MAILADDRESS_EXTERNAL_USE'),
    update: Require.permission('MAILADDRESS_EXTERNAL_ADMIN'),
} as const

import { Require } from '@/auth/authorizer/Require'

export const mailAliasAuth = {
    create: Require.permission('MAILALIAS_ADMIN'),
    readMany: Require.permission('MAILALIAS_USE'),
    read: Require.permission('MAILALIAS_USE'),
    update: Require.permission('MAILALIAS_ADMIN'),
    destroy: Require.permission('MAILALIAS_ADMIN'),
} as const

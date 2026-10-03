import { Require } from '@/auth/authorizer/Require'

export const notificationAuth = {
    create: Require.permission('NOTIFICATION_ADMIN'),
    sendMail: Require.permission('MAIL_USE'),
} as const

import { RequirePermission } from '@/auth/authorizer/RequirePermission'

export const sendMailAuth = {
    sendMail: RequirePermission.staticFields({ permission: 'MAIL_SEND' }),
} as const

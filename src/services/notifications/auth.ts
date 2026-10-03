import { RequirePermission } from '@/auth/authorizer/RequirePermission'

export const notificationAuth = {
    create: RequirePermission.staticFields({ permission: 'NOTIFICATION_CREATE' }),
} as const

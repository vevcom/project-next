import { RequireUser } from '@/auth/authorizer/RequireUser'
import { RequirePermission } from '@/auth/authorizer/RequirePermission'

export const reportAuth = {
    read: RequireUser.staticFields({}),
    update: RequirePermission.staticFields({ permission: 'REPORT_ADMIN' })
} as const

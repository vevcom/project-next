import { RequireNothing } from '@/auth/authorizer/RequireNothing'
import { RequirePermission } from '@/auth/authorizer/RequirePermission'

export const cabinArticleAuth = {
    read: RequireNothing.staticFields({}),
    update: RequirePermission.staticFields({ permission: 'CABIN_ADMIN' })
} as const

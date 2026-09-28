import { RequirePermission } from '@/auth/authorizer/RequirePermission'

export const cabinReleasePeriodAuth = {
    create: RequirePermission.staticFields({ permission: 'CABIN_ADMIN' }),
    destroy: RequirePermission.staticFields({ permission: 'CABIN_ADMIN' }),
    readMany: RequirePermission.staticFields({ permission: 'CABIN_ADMIN' }),
    getCurrentReleasePeriod: RequirePermission.staticFields({ permission: 'CABIN_ADMIN' }),
    update: RequirePermission.staticFields({ permission: 'CABIN_ADMIN' }),
} as const

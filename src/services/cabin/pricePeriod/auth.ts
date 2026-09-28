import { RequirePermission } from '@/auth/authorizer/RequirePermission'

export const cabinPricePeriodAuth = {
    create: RequirePermission.staticFields({ permission: 'CABIN_ADMIN' }),
    destroy: RequirePermission.staticFields({ permission: 'CABIN_ADMIN' }),
    readMany: RequirePermission.staticFields({ permission: 'CABIN_ADMIN' }),
    readPublicPeriods: RequirePermission.staticFields({ permission: 'CABIN_CALENDAR_READ' }),
    readUnreleasedPeriods: RequirePermission.staticFields({ permission: 'CABIN_ADMIN' }),
    update: RequirePermission.staticFields({ permission: 'CABIN_ADMIN' }),
} as const

import { RequirePermission } from '@/auth/authorizer/RequirePermission'

export const cabinProductAuth = {
    create: RequirePermission.staticFields({ permission: 'CABIN_PRODUCTS_ADMIN' }),
    createPrice: RequirePermission.staticFields({ permission: 'CABIN_PRODUCTS_ADMIN' }),
    read: RequirePermission.staticFields({ permission: 'CABIN_CALENDAR_READ' }),
    readActive: RequirePermission.staticFields({ permission: 'CABIN_CALENDAR_READ' }),
    readMany: RequirePermission.staticFields({ permission: 'CABIN_CALENDAR_READ' }),
} as const

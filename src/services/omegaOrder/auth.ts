import { RequirePermission } from '@/auth/authorizer/RequirePermission'

export const omegaOrderAuth = {
    create: RequirePermission.staticFields({ permission: 'OMEGA_ORDER_CREATE' }),
    readCurrent: RequirePermission.staticFields({ permission: 'OMEGA_ORDER_READ' }),
    readRequirements: RequirePermission.staticFields({ permission: 'OMEGA_ORDER_READ' }),
    readAll: RequirePermission.staticFields({ permission: 'OMEGA_ORDER_READ' })
} as const

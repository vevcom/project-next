import { RequirePermission } from '@/auth/authorizer/RequirePermission'


export const bullshitAuth = {
    create: RequirePermission.staticFields({ permission: 'BULLSHIT_WRITE' }),
    readPage: RequirePermission.staticFields({ permission: 'BULLSHIT_READ' })
} as const

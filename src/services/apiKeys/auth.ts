import { Require } from '@/auth/authorizer/Require'
import { requireHoldsGrantedPermissions } from '@/auth/authorizer/RequireHoldsGrantedPermissions'

const baseAuthorizer = Require.permission('APIKEY_ADMIN')

export const apiKeyAuth = {
    create: baseAuthorizer,
    read: baseAuthorizer,
    readMany: baseAuthorizer,
    readWithHash: baseAuthorizer,
    update: Require.allOf(baseAuthorizer, requireHoldsGrantedPermissions),
    updateIfExpired: baseAuthorizer,
    destroy: baseAuthorizer,
}

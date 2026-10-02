import { AuthorizerFactory } from './Authorizer'
import type { Permission } from '@/prisma-generated-pn-types'

/**
 * The user the resource is about, or every one of the permissions.
 */
export const RequireUserIdOrEveryPermission = AuthorizerFactory<
    { permissions: Permission[] },
    { userId: number },
    'USER_NOT_REQUIERED_FOR_AUTHORIZED'
>(({ session, staticFields, dynamicFields }) => ({
    success: (session.user !== null && session.user.id === dynamicFields.userId)
        || staticFields.permissions.every(permission => session.permissions.includes(permission)),
    session,
    errorMessage: 'Du har ikke tilgang til denne ressursen',
}))

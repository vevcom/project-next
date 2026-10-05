import { Require } from './Require'
import type { Permission } from '@/prisma-generated-pn-types'

/**
 * The session holds every permission it is about to hand on, or PERMISSION_ADMIN, which can grant
 * any of them anyway. For the operations that hand permissions on to someone else, so that holding
 * the admin permission of what grants them is not a way to more permissions than one has. Needs
 * `{ grantedPermissions: Permission[] }` supplied via `.data()`.
 */
export const requireHoldsGrantedPermissions = Require.ownership<{ grantedPermissions: Permission[] }>(
    ({ session, grantedPermissions }) => session.permissions.includes('PERMISSION_ADMIN')
        || grantedPermissions.every(permission => session.permissions.includes(permission)),
    { errorMessage: 'Du kan ikke gi bort tillatelser du ikke har selv.' },
)

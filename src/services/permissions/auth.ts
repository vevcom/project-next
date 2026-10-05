import { Require } from '@/auth/authorizer/Require'
import type { Permission } from '@/prisma-generated-pn-types'


export const permissionsAuth = {
    readGroupPermissions: Require.permission('PERMISSION_USE').or().groupAdmin().or()
        .ownership<{ groupTypeAdminPermission: Permission | null }>(({ session, groupTypeAdminPermission }) =>
            groupTypeAdminPermission !== null && session.permissions.includes(groupTypeAdminPermission)
        ),
    readPermissionMatrix: Require.permission('PERMISSION_USE'),
    readPermissionsOfUser: Require.permission('PERMISSION_USE').or().userId(),
    updateGroupPermission: Require.permission('PERMISSION_ADMIN'),

    readDefaultPermissions: Require.nothing(),
    updateDefaultPermissions: Require.permission('PERMISSION_ADMIN'),
}

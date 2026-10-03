import { Require } from '@/auth/authorizer/Require'


export const permissionsAuth = {
    readGroupPermissions: Require.permission('PERMISSION_USE'),
    readPermissionMatrix: Require.permission('PERMISSION_USE'),
    updateGroupPermission: Require.permission('PERMISSION_ADMIN'),

    readDefaultPermissions: Require.nothing(),
    updateDefaultPermissions: Require.permission('PERMISSION_ADMIN'),
}

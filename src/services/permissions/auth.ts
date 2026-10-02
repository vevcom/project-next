import { RequireNothing } from '@/auth/authorizer/RequireNothing'
import { RequirePermission } from '@/auth/authorizer/RequirePermission'
import { RequireUserIdOrPermission } from '@/auth/authorizer/RequireUserIdOrPermission'

export const permissionsAuth = {
    readGroupPermissions: RequirePermission.staticFields({ permission: 'PERMISSION_GROUP_READ' }),
    readPermissionMatrix: RequirePermission.staticFields({ permission: 'PERMISSION_GROUP_READ' }),
    readPermissionsOfUser: RequireUserIdOrPermission.staticFields({ permission: 'PERMISSION_GROUP_READ' }),
    updateGroupPermission: RequirePermission.staticFields({ permission: 'PERMISSION_GROUP_ADMIN' }),

    readDefaultPermissions: RequireNothing.staticFields({}),
    updateDefaultPermissions: RequirePermission.staticFields({ permission: 'PERMISSION_DEFAULT_ADMIN' }),
}

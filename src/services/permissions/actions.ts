'use server'

import { makeAction } from '@/services/serverAction'
import { permissionOperations } from '@/services/permissions/operations'

export const readPermissionOfGroupAction = makeAction(permissionOperations.readPermissionsOfGroup)
export const readPermissionsOfUserAction = makeAction(permissionOperations.readPermissionsOfUser)
export const readPermissionMatrixAction = makeAction(permissionOperations.readPermissionMatrix)
export const readDefaultPermissionsAction = makeAction(permissionOperations.readDefaultPermissions)
export const updateDefaultPermissionsAction = makeAction(permissionOperations.updateDefaultPermissions)
export const updateGroupPermissionAction = makeAction(permissionOperations.updateGroupPermission)

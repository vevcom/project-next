import { Require } from '@/auth/authorizer/Require'
import { requireReadManagedGroupMembers, requireReadMembershipsOfUser } from '@/services/groups/auth'
import { requireHoldsGrantedPermissions } from '@/auth/authorizer/RequireHoldsGrantedPermissions'

const adminOrGroupAdmin = Require.permission('MANUAL_GROUP_ADMIN').or().groupAdmin()
// Adding a member or making one an admin hands out the group's permissions, so the session must
// hold them already. A group admin always does. Needs `{ groupId, grantedPermissions }`, the latter
// being the permissions of the group.
const grantMembership = Require.allOf(adminOrGroupAdmin, requireHoldsGrantedPermissions)

export const manualGroupAuth = {
    create: Require.permission('MANUAL_GROUP_ADMIN'),
    read: Require.permission('MANUAL_GROUP_USE'),
    readMany: Require.permission('MANUAL_GROUP_USE'),
    readExpanded: Require.permission('MANUAL_GROUP_USE'),
    readMembers: requireReadManagedGroupMembers('MANUAL_GROUP_USE'),
    readMembershipsOfUser: requireReadMembershipsOfUser('MANUAL_GROUP_USE'),
    update: Require.permission('MANUAL_GROUP_ADMIN'),
    destroy: Require.permission('MANUAL_GROUP_ADMIN'),
    pension: Require.permission('MANUAL_GROUP_ADMIN'),
    addMembers: grantMembership,
    removeMembers: adminOrGroupAdmin,
    setMemberAdmin: grantMembership,
    setMemberTitle: adminOrGroupAdmin,
    migrateGroup: adminOrGroupAdmin,
} as const

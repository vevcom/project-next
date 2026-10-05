import { Require } from '@/auth/authorizer/Require'
import { requireReadManagedGroupMembers, requireReadMembershipsOfUser } from '@/services/groups/auth'
import { requireHoldsGrantedPermissions } from '@/auth/authorizer/RequireHoldsGrantedPermissions'

export const committeeLogosImagePanelAuth = Require.permission('COMMITTEE_ADMIN')

const adminOrGroupAdmin = Require.permission('COMMITTEE_ADMIN').or().groupAdmin()
// Adding a member or making one an admin hands out the group's permissions, so the session must
// hold them already. A group admin always does. Needs `{ groupId, grantedPermissions }`, the latter
// being the permissions of the group.
const grantMembership = Require.allOf(adminOrGroupAdmin, requireHoldsGrantedPermissions)

export const committeeAuth = {
    create: Require.permission('COMMITTEE_ADMIN'),
    update: Require.permission('COMMITTEE_ADMIN'),
    readAll: Require.permission('COMMITTEE_USE'),
    read: Require.permission('COMMITTEE_USE'),
    readMembers: requireReadManagedGroupMembers('COMMITTEE_USE'),
    readMembershipsOfUser: requireReadMembershipsOfUser('COMMITTEE_USE'),
    readExpanded: Require.permission('COMMITTEE_USE'),
    addMembers: grantMembership,
    removeMembers: adminOrGroupAdmin,
    setMemberAdmin: grantMembership,
    setMemberTitle: adminOrGroupAdmin,
    migrateGroup: adminOrGroupAdmin,
    readArticle: Require.permission('COMMITTEE_USE'),
    readParagraph: Require.permission('COMMITTEE_USE'),
    destroy: Require.permission('COMMITTEE_ADMIN'),
    pension: Require.permission('COMMITTEE_ADMIN'),
    updateParagraphContent: adminOrGroupAdmin,
    updateLogo: adminOrGroupAdmin,
    updateArticle: adminOrGroupAdmin,
} as const

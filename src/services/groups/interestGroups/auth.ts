import { Require } from '@/auth/authorizer/Require'
import { requireReadManagedGroupMembers, requireReadMembershipsOfUser } from '@/services/groups/auth'
import { requireHoldsGrantedPermissions } from '@/auth/authorizer/RequireHoldsGrantedPermissions'

const groupAdminOrInterestGroupAdmin = Require.permission('INTEREST_GROUP_ADMIN').or().groupAdmin()
// Adding a member or making one an admin hands out the group's permissions, so the session must
// hold them already. A group admin always does. Needs `{ groupId, grantedPermissions }`, the latter
// being the permissions of the group.
const grantMembership = Require.allOf(groupAdminOrInterestGroupAdmin, requireHoldsGrantedPermissions)

export const interestGroupAuth = {
    create: Require.permission('INTEREST_GROUP_ADMIN'),
    read: Require.permission('INTEREST_GROUP_USE'),
    readMany: Require.permission('INTEREST_GROUP_USE'),
    readExpanded: Require.permission('INTEREST_GROUP_USE'),
    readMembers: requireReadManagedGroupMembers('INTEREST_GROUP_USE'),
    readMembershipsOfUser: requireReadMembershipsOfUser('INTEREST_GROUP_USE'),
    addMembers: grantMembership,
    removeMembers: groupAdminOrInterestGroupAdmin,
    setMemberAdmin: grantMembership,
    setMemberTitle: groupAdminOrInterestGroupAdmin,
    migrateGroup: groupAdminOrInterestGroupAdmin,
    update: groupAdminOrInterestGroupAdmin,
    destroy: Require.permission('INTEREST_GROUP_ADMIN'),
    pension: Require.permission('INTEREST_GROUP_ADMIN'),
    readSpecialCmsParagraphGeneralInfo: Require.permission('INTEREST_GROUP_USE'),
    updateSpecialCmsParagraphContentGeneralInfo: Require.permission('INTEREST_GROUP_ADMIN'),
    updateArticleSection: groupAdminOrInterestGroupAdmin,
}

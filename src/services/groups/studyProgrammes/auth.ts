import { Require } from '@/auth/authorizer/Require'
import { requireReadManagedGroupMembers, requireReadMembershipsOfUser } from '@/services/groups/auth'
import { requireHoldsGrantedPermissions } from '@/auth/authorizer/RequireHoldsGrantedPermissions'

const adminOrGroupAdmin = Require.permission('STUDY_PROGRAMME_ADMIN').or().groupAdmin()
// Adding a member or making one an admin hands out the group's permissions, so the session must
// hold them already. A group admin always does. Needs `{ groupId, grantedPermissions }`, the latter
// being the permissions of the group.
const grantMembership = Require.allOf(adminOrGroupAdmin, requireHoldsGrantedPermissions)

export const studyProgrammeAuth = {
    create: Require.permission('STUDY_PROGRAMME_ADMIN'),
    upsertMany: Require.permission('STUDY_PROGRAMME_ADMIN'),
    readFeideReturnedForUser: Require.permission('STUDY_PROGRAMME_ADMIN'),
    recordFeideReturnedForUser: Require.permission('STUDY_PROGRAMME_ADMIN'),
    read: Require.permission('STUDY_PROGRAMME_USE'),
    readMany: Require.permission('STUDY_PROGRAMME_USE'),
    readExpanded: Require.permission('STUDY_PROGRAMME_USE'),
    readMembers: requireReadManagedGroupMembers('STUDY_PROGRAMME_USE'),
    readMembershipsOfUser: requireReadMembershipsOfUser('STUDY_PROGRAMME_USE'),
    update: Require.permission('STUDY_PROGRAMME_ADMIN'),
    addMembers: grantMembership,
    removeMembers: adminOrGroupAdmin,
    setMemberAdmin: grantMembership,
    setMemberTitle: adminOrGroupAdmin,
    destroy: Require.permission('STUDY_PROGRAMME_ADMIN'),
    migrateGroups: Require.permission('STUDY_PROGRAMME_ADMIN'),
} as const

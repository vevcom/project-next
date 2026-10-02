import { RequirePermission } from '@/auth/authorizer/RequirePermission'
import { RequirePermissionOrGroupAdmin } from '@/auth/authorizer/RequirePermissionOrGroupAdmin'
import { requireReadManagedGroupMembers, requireReadMembershipsOfUser } from '@/services/groups/auth'

export const studyProgrammeAuth = {
    create: RequirePermission.staticFields({ permission: 'STUDY_PROGRAMME_ADMIN' }),
    upsertMany: RequirePermission.staticFields({ permission: 'STUDY_PROGRAMME_ADMIN' }),
    readFeideReturnedForUser: RequirePermission.staticFields({ permission: 'STUDY_PROGRAMME_ADMIN' }),
    recordFeideReturnedForUser: RequirePermission.staticFields({ permission: 'STUDY_PROGRAMME_ADMIN' }),
    read: RequirePermission.staticFields({ permission: 'STUDY_PROGRAMME_READ' }),
    readMany: RequirePermission.staticFields({ permission: 'STUDY_PROGRAMME_READ' }),
    readExpanded: RequirePermission.staticFields({ permission: 'STUDY_PROGRAMME_READ' }),
    readMembers: requireReadManagedGroupMembers('STUDY_PROGRAMME_READ'),
    readMembershipsOfUser: requireReadMembershipsOfUser('STUDY_PROGRAMME_READ'),
    update: RequirePermission.staticFields({ permission: 'STUDY_PROGRAMME_ADMIN' }),
    addMembers: RequirePermissionOrGroupAdmin.staticFields({ permission: 'STUDY_PROGRAMME_ADMIN' }),
    removeMembers: RequirePermissionOrGroupAdmin.staticFields({ permission: 'STUDY_PROGRAMME_ADMIN' }),
    setMemberAdmin: RequirePermissionOrGroupAdmin.staticFields({ permission: 'STUDY_PROGRAMME_ADMIN' }),
    setMemberTitle: RequirePermissionOrGroupAdmin.staticFields({ permission: 'STUDY_PROGRAMME_ADMIN' }),
    destroy: RequirePermission.staticFields({ permission: 'STUDY_PROGRAMME_ADMIN' }),
    migrateGroups: RequirePermission.staticFields({ permission: 'STUDY_PROGRAMME_ADMIN' }),
} as const

import { RequirePermission } from '@/auth/authorizer/RequirePermission'
import { RequirePermissionOrGroupAdmin } from '@/auth/authorizer/RequirePermissionOrGroupAdmin'

export const studyProgrammeAuth = {
    create: RequirePermission.staticFields({ permission: 'STUDY_PROGRAMME_CREATE' }),
    upsertMany: RequirePermission.staticFields({ permission: 'STUDY_PROGRAMME_CREATE' }),
    read: RequirePermission.staticFields({ permission: 'STUDY_PROGRAMME_READ' }),
    readMany: RequirePermission.staticFields({ permission: 'STUDY_PROGRAMME_READ' }),
    readExpanded: RequirePermission.staticFields({ permission: 'STUDY_PROGRAMME_READ' }),
    readMembers: RequirePermission.staticFields({ permission: 'STUDY_PROGRAMME_READ' }),
    update: RequirePermission.staticFields({ permission: 'STUDY_PROGRAMME_UPDATE' }),
    addMembers: RequirePermissionOrGroupAdmin.staticFields({ permission: 'STUDY_PROGRAMME_UPDATE' }),
    removeMembers: RequirePermissionOrGroupAdmin.staticFields({ permission: 'STUDY_PROGRAMME_UPDATE' }),
    setMemberAdmin: RequirePermissionOrGroupAdmin.staticFields({ permission: 'STUDY_PROGRAMME_UPDATE' }),
    setMemberTitle: RequirePermissionOrGroupAdmin.staticFields({ permission: 'STUDY_PROGRAMME_UPDATE' }),
    destroy: RequirePermission.staticFields({ permission: 'STUDY_PROGRAMME_DESTROY' }),
    migrateGroups: RequirePermission.staticFields({ permission: 'STUDY_PROGRAMME_UPDATE' }),
} as const

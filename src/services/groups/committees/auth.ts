import { RequirePermission } from '@/auth/authorizer/RequirePermission'
import { RequirePermissionOrGroupAdmin } from '@/auth/authorizer/RequirePermissionOrGroupAdmin'

export const committeeLogosImagePanelAuth = RequirePermission.staticFields({ permission: 'COMMITTEE_UPDATE' })

export const committeeAuth = {
    create: RequirePermission.staticFields({ permission: 'COMMITTEE_CREATE' }),
    update: RequirePermission.staticFields({ permission: 'COMMITTEE_UPDATE' }),
    readAll: RequirePermission.staticFields({ permission: 'COMMITTEE_READ' }),
    read: RequirePermission.staticFields({ permission: 'COMMITTEE_READ' }),
    readMembers: RequirePermission.staticFields({ permission: 'COMMITTEE_READ' }),
    readExpanded: RequirePermission.staticFields({ permission: 'COMMITTEE_READ' }),
    addMembers: RequirePermissionOrGroupAdmin.staticFields({ permission: 'COMMITTEE_UPDATE' }),
    removeMembers: RequirePermissionOrGroupAdmin.staticFields({ permission: 'COMMITTEE_UPDATE' }),
    setMemberAdmin: RequirePermissionOrGroupAdmin.staticFields({ permission: 'COMMITTEE_UPDATE' }),
    setMemberTitle: RequirePermissionOrGroupAdmin.staticFields({ permission: 'COMMITTEE_UPDATE' }),
    migrateGroup: RequirePermissionOrGroupAdmin.staticFields({ permission: 'COMMITTEE_UPDATE' }),
    readArticle: RequirePermission.staticFields({ permission: 'COMMITTEE_READ' }),
    readParagraph: RequirePermission.staticFields({ permission: 'COMMITTEE_READ' }),
    destroy: RequirePermission.staticFields({ permission: 'COMMITTEE_DESTROY' }),
    updateParagraphContent: RequirePermissionOrGroupAdmin.staticFields({ permission: 'COMMITTEE_UPDATE' }),
    updateLogo: RequirePermissionOrGroupAdmin.staticFields({ permission: 'COMMITTEE_UPDATE' }),
    updateArticle: RequirePermissionOrGroupAdmin.staticFields({ permission: 'COMMITTEE_UPDATE' }),
} as const

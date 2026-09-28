import { RequirePermission } from '@/auth/authorizer/RequirePermission'
import { RequirePermissionOrGroupAdmin } from '@/auth/authorizer/RequirePermissionOrGroupAdmin'

export const committeeLogosImagePanelAuth = RequirePermission.staticFields({ permission: 'COMMITTEE_ADMIN' })

export const committeeAuth = {
    create: RequirePermission.staticFields({ permission: 'COMMITTEE_ADMIN' }),
    update: RequirePermission.staticFields({ permission: 'COMMITTEE_ADMIN' }),
    readAll: RequirePermission.staticFields({ permission: 'COMMITTEE_READ' }),
    read: RequirePermission.staticFields({ permission: 'COMMITTEE_READ' }),
    readMembers: RequirePermission.staticFields({ permission: 'COMMITTEE_READ' }),
    readExpanded: RequirePermission.staticFields({ permission: 'COMMITTEE_READ' }),
    addMembers: RequirePermissionOrGroupAdmin.staticFields({ permission: 'COMMITTEE_ADMIN' }),
    removeMembers: RequirePermissionOrGroupAdmin.staticFields({ permission: 'COMMITTEE_ADMIN' }),
    setMemberAdmin: RequirePermissionOrGroupAdmin.staticFields({ permission: 'COMMITTEE_ADMIN' }),
    setMemberTitle: RequirePermissionOrGroupAdmin.staticFields({ permission: 'COMMITTEE_ADMIN' }),
    migrateGroup: RequirePermissionOrGroupAdmin.staticFields({ permission: 'COMMITTEE_ADMIN' }),
    readArticle: RequirePermission.staticFields({ permission: 'COMMITTEE_READ' }),
    readParagraph: RequirePermission.staticFields({ permission: 'COMMITTEE_READ' }),
    destroy: RequirePermission.staticFields({ permission: 'COMMITTEE_ADMIN' }),
    pension: RequirePermission.staticFields({ permission: 'COMMITTEE_ADMIN' }),
    updateParagraphContent: RequirePermissionOrGroupAdmin.staticFields({ permission: 'COMMITTEE_ADMIN' }),
    updateLogo: RequirePermissionOrGroupAdmin.staticFields({ permission: 'COMMITTEE_ADMIN' }),
    updateArticle: RequirePermissionOrGroupAdmin.staticFields({ permission: 'COMMITTEE_ADMIN' }),
} as const

import { RequirePermission } from '@/auth/authorizer/RequirePermission'

export const classAuth = {
    read: RequirePermission.staticFields({ permission: 'CLASS_READ' }),
    readMany: RequirePermission.staticFields({ permission: 'CLASS_READ' }),
    readExpanded: RequirePermission.staticFields({ permission: 'CLASS_READ' }),
    readMembers: RequirePermission.staticFields({ permission: 'CLASS_READ' }),
    readClassOfUser: RequirePermission.staticFields({ permission: 'CLASS_READ' }),
    changeClassOfUser: RequirePermission.staticFields({ permission: 'CLASS_UPDATE' }),
    bumpClasses: RequirePermission.staticFields({ permission: 'CLASS_UPDATE' }),
    migrateGroups: RequirePermission.staticFields({ permission: 'CLASS_UPDATE' }),
} as const

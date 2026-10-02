import { RequirePermission } from '@/auth/authorizer/RequirePermission'
import { requireReadGroupMembers, requireReadMembershipsOfUser } from '@/services/groups/auth'

export const classAuth = {
    read: RequirePermission.staticFields({ permission: 'CLASS_READ' }),
    readMany: RequirePermission.staticFields({ permission: 'CLASS_READ' }),
    readExpanded: RequirePermission.staticFields({ permission: 'CLASS_READ' }),
    readMembers: requireReadGroupMembers('CLASS_READ'),
    readMembershipsOfUser: requireReadMembershipsOfUser('CLASS_READ'),
    readClassOfUser: RequirePermission.staticFields({ permission: 'CLASS_READ' }),
    changeClassOfUser: RequirePermission.staticFields({ permission: 'CLASS_ADMIN' }),
    bumpClasses: RequirePermission.staticFields({ permission: 'CLASS_ADMIN' }),
    migrateGroups: RequirePermission.staticFields({ permission: 'CLASS_ADMIN' }),
} as const

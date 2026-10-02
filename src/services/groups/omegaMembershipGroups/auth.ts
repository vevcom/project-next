import { RequirePermission } from '@/auth/authorizer/RequirePermission'
import { requireReadGroupMembers, requireReadMembershipsOfUser } from '@/services/groups/auth'

export const omegaMembershipGroupAuth = {
    read: RequirePermission.staticFields({ permission: 'OMEGA_MEMBERSHIP_GROUP_READ' }),
    readMany: RequirePermission.staticFields({ permission: 'OMEGA_MEMBERSHIP_GROUP_READ' }),
    readExpanded: RequirePermission.staticFields({ permission: 'OMEGA_MEMBERSHIP_GROUP_READ' }),
    readMembers: requireReadGroupMembers('OMEGA_MEMBERSHIP_GROUP_READ'),
    readMembershipsOfUser: requireReadMembershipsOfUser('OMEGA_MEMBERSHIP_GROUP_READ'),
    readUserLevel: RequirePermission.staticFields({ permission: 'OMEGA_MEMBERSHIP_GROUP_READ' }),
    inferUserLevel: RequirePermission.staticFields({ permission: 'OMEGA_MEMBERSHIP_GROUP_READ' }),
    updateUserLevel: RequirePermission.staticFields({ permission: 'OMEGA_MEMBERSHIP_GROUP_ADMIN' }),
    updateUserOrder: RequirePermission.staticFields({ permission: 'OMEGA_MEMBERSHIP_GROUP_ADMIN' }),
    migrateGroups: RequirePermission.staticFields({ permission: 'OMEGA_MEMBERSHIP_GROUP_ADMIN' }),
} as const

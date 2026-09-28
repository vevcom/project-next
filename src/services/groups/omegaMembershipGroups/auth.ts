import { RequirePermission } from '@/auth/authorizer/RequirePermission'

export const omegaMembershipGroupAuth = {
    read: RequirePermission.staticFields({ permission: 'OMEGA_MEMBERSHIP_GROUP_READ' }),
    readMany: RequirePermission.staticFields({ permission: 'OMEGA_MEMBERSHIP_GROUP_READ' }),
    readExpanded: RequirePermission.staticFields({ permission: 'OMEGA_MEMBERSHIP_GROUP_READ' }),
    readMembers: RequirePermission.staticFields({ permission: 'OMEGA_MEMBERSHIP_GROUP_READ' }),
    readUserLevel: RequirePermission.staticFields({ permission: 'OMEGA_MEMBERSHIP_GROUP_READ' }),
    updateUserLevel: RequirePermission.staticFields({ permission: 'OMEGA_MEMBERSHIP_GROUP_UPDATE' }),
    migrateGroups: RequirePermission.staticFields({ permission: 'OMEGA_MEMBERSHIP_GROUP_UPDATE' }),
} as const

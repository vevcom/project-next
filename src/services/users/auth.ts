import { RequirePermission } from '@/auth/authorizer/RequirePermission'
import { RequireUser } from '@/auth/authorizer/RequireUser'
import { RequireUserFieldOrPermission } from '@/auth/authorizer/RequireUserFieldOrPermission'
import { RequireUserId } from '@/auth/authorizer/RequireUserId'
import { RequireUserIdOrPermission } from '@/auth/authorizer/RequireUserIdOrPermission'
import { RequireUsernameOrPermission } from '@/auth/authorizer/RequireUsernameOrPermission'

export const profileImagesImagePanelAuth = RequirePermission.staticFields({ permission: 'USERS_UPDATE' })

export const userAuth = {
    readProfile: RequireUsernameOrPermission.staticFields({ permission: 'USERS_READ' }),
    read: RequireUserFieldOrPermission.staticFields({ permission: 'USERS_READ' }),
    readOrNull: RequireUserFieldOrPermission.staticFields({ permission: 'USERS_READ' }),
    readPage: RequirePermission.staticFields({ permission: 'USERS_READ' }),
    search: RequirePermission.staticFields({ permission: 'USERS_READ' }),
    create: RequirePermission.staticFields({ permission: 'USERS_CREATE' }),
    connectStudentCard: RequireUser.staticFields({}),
    registerNewEmail: RequireUserIdOrPermission.staticFields({ permission: 'USERS_UPDATE' }),
    updatePassword: RequireUserIdOrPermission.staticFields({ permission: 'USERS_UPDATE' }),
    update: RequirePermission.staticFields({ permission: 'USERS_UPDATE' }),
    updateProfile: RequireUsernameOrPermission.staticFields({ permission: 'USERS_UPDATE' }),
    updateProfileImage: RequireUsernameOrPermission.staticFields({ permission: 'USERS_UPDATE' }),
    updateBioParagraphContent: RequireUserIdOrPermission.staticFields({ permission: 'USERS_UPDATE' }),
    register: RequireUserId.staticFields({}),
    destroy: RequirePermission.staticFields({ permission: 'USERS_DESTROY' }),
} as const

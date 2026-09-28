import { RequireNothing } from '@/auth/authorizer/RequireNothing'
import { RequirePermission } from '@/auth/authorizer/RequirePermission'

export const newStudentAuth = {
    read: RequireNothing.staticFields({}),
    update: RequirePermission.staticFields({ permission: 'NEW_STUDENT_ADMIN' })
} as const

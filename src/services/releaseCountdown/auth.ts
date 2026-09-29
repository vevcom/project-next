import { RequireNothing } from '@/auth/authorizer/RequireNothing'

export const releaseCountdownAuth = {
    readIsActive: RequireNothing.staticFields({}),
    unlock: RequireNothing.staticFields({}),
} as const

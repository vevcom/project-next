import { Require } from '@/auth/authorizer/Require'

// Only the NextAuth adapter and callbacks call these, with bypassAuth - there are no actions. The
// rule is there so that exposing one by mistake offers it to nobody but a user admin.
export const feideAccountAuth = {
    create: Require.permission('USERS_ADMIN'),
    readUser: Require.permission('USERS_ADMIN'),
    updateEmail: Require.permission('USERS_ADMIN'),
} as const

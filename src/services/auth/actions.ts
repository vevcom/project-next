'use server'

import { makeAction } from '@/services/serverAction'
import { authOperations } from '@/services/auth/operations'

export const verifyResetPasswordTokenAction = makeAction(authOperations.verifyResetPasswordToken)
export const resetPasswordAction = makeAction(authOperations.resetPassword)
export const sendResetPasswordEmailAction = makeAction(authOperations.sendResetPasswordEmail)

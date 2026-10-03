import '@pn-server-only'
import { emailValidationExpiration } from './constants'
import { VerifyEmailTemplate } from '@/lib/email/templates/verifyEmail'
import { sendMailOperations } from '@/services/notifications/send-mail/operations'
import { generateJWT } from '@/jwt/jwt'
import { userSchemas } from '@/services/users/schemas'
import type { UserFiltered } from '@/services/users/types'

// TODO: Fix this with new validation
export async function sendVerifyEmail(user: UserFiltered, email: string) {
    const parse = userSchemas.verifyEmail.parse({ email })

    const jwt = generateJWT('verifyemail', {
        email: parse.email,
        sub: user.id,
    }, emailValidationExpiration)

    const link = `${process.env.WEBSITE_URL}/verify-email?token=${jwt}`

    await sendMailOperations.internal.sendSystemMail.internalCall({
        data: {
            to: parse.email,
            subject: 'Bekreft e-post',
            body: <VerifyEmailTemplate user={user} link={link} />,
        },
    })
}

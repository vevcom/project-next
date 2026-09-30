import '@pn-server-only'
import { sendSystemMail } from '@/lib/email/send'
import { ResetPasswordTemplate } from '@/lib/email/templates/resetPassword'
import { generateJWT } from '@/jwt/jwt'
import { userOperations } from '@/services/users/operations'
import { ServiceError } from '@/services/error'
import { z } from 'zod'

export async function sendResetPasswordMail(email: string) {
    const emailParsed = z.string().email().parse(email)

    try {
        const user = await userOperations.read({
            params: { email: emailParsed },
            bypassAuth: true,
        })

        const jwt = generateJWT('resetpassword', {
            sub: user.id,
        }, 60 * 60)

        const link = `${process.env.WEBSITE_URL}/reset-password-form?token=${jwt}`

        await sendSystemMail(user.email, 'Glemt passord', <ResetPasswordTemplate user={user} link={link} />)

        return email
    } catch (e) {
        if (e instanceof ServiceError && e.errorCode === 'NOT FOUND') {
            return email
        }
        throw e
    }
}

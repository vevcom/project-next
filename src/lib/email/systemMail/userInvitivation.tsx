import { generateJWT } from '@/jwt/jwt'
import type { UserFiltered } from '@/services/users/types'
import '@pn-server-only'
import { userInvitationExpiration } from './constants'
import { sendMailOperations } from '@/services/notifications/send-mail/operations'
import { UserInvitationTemplate } from '@/lib/email/templates/userInvitation'


export async function sendUserInvitationEmail(user: UserFiltered) {
    const jwt = generateJWT('verifyemail', {
        sub: user.id,
        email: user.email,
    }, userInvitationExpiration)

    const link = `${process.env.WEBSITE_URL}/verify-email?token=${jwt}`

    await sendMailOperations.internal.sendSystemMail.internalCall({
        data: {
            to: user.email,
            subject: `Invitasjon til ${process.env.WEBSITE_DOMAIN}`,
            body: <UserInvitationTemplate user={user} link={link} />,
        },
    })
}

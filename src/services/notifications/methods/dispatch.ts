import { sendMailSchemas } from '@/services/notifications/send-mail/schemas'
import { sendMailOperations } from '@/services/notifications/send-mail/operations'
import { repalceSpecialSymbols } from './helpers'
import { DEFAULT_NOTIFICATION_ALIAS } from '@/lib/email/constants'
import { wrapInHTML } from '@/lib/email/wrapInHTML'
import type { Notification } from '@/prisma-generated-pn-types'
import type { UserFiltered } from '@/services/users/types'

/**
 * Sends a notification as one immediate email per recipient. The recipients are expected to be
 * already resolved (see recipientsWhere) - this only renders and sends.
 */
export async function sendNotificationEmails(
    senderAddress: string | null,
    notification: Notification,
    users: UserFiltered[]
) {
    const senderAlias = senderAddress ?? DEFAULT_NOTIFICATION_ALIAS

    const mails = await Promise.all(users.map(async user => {
        const parsed = sendMailSchemas.sendMail.parse({
            from: senderAlias,
            to: user.email,
            subject: repalceSpecialSymbols(notification.title, user),
            text: repalceSpecialSymbols(notification.message, user),
        })

        return {
            from: parsed.from,
            to: parsed.to,
            subject: parsed.subject,
            html: await wrapInHTML(user, parsed.text),
            list: {
                unsubscribe: {
                    url: `${process.env.WEBSITE_URL}/users/${user.username}/unsubscribe`,
                    comment: 'Comment'
                },
            }
        }
    }))

    await sendMailOperations.internal.sendBulkMail.internalCall({ data: mails })
}

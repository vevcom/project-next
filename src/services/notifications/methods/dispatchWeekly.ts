import { sendMailSchemas } from '@/services/notifications/send-mail/schemas'
import { sendMailOperations } from '@/services/notifications/send-mail/operations'
import { repalceSpecialSymbols } from './helpers'
import { weeklyDigest } from './constants'
import { DEFAULT_NOTIFICATION_ALIAS } from '@/lib/email/constants'
import { wrapInHTML } from '@/lib/email/wrapInHTML'
import type { WeeklyDigestNotification } from './types'
import type { UserFiltered } from '@/services/users/types'

/**
 * Builds the markdown body of one user's weekly digest. The default email template renders the
 * text as markdown, so each notification becomes its own section.
 */
export function buildWeeklyDigestText(user: UserFiltered, notifications: WeeklyDigestNotification[]) {
    return notifications.map(notification => [
        `## ${repalceSpecialSymbols(notification.title, user)}`,
        `*${notification.channel.name}*`,
        repalceSpecialSymbols(notification.message, user),
    ].join('\n')).join('\n\n')
}

/**
 * Sends one user their weekly digest mail containing the given notifications. The digest spans
 * channels, so it is always sent from the default notification alias rather than a channel's own.
 */
export async function sendWeeklyEmailDigest(user: UserFiltered, notifications: WeeklyDigestNotification[]) {
    const parsed = sendMailSchemas.sendMail.parse({
        from: DEFAULT_NOTIFICATION_ALIAS,
        to: user.email,
        subject: weeklyDigest.subject,
        text: buildWeeklyDigestText(user, notifications),
    })

    await sendMailOperations.internal.sendBulkMail.internalCall({
        data: [{
            from: parsed.from,
            to: parsed.to,
            subject: parsed.subject,
            html: await wrapInHTML(user, parsed.text),
            list: {
                unsubscribe: {
                    url: `${process.env.WEBSITE_URL}/users/${user.username}/unsubscribe`,
                    comment: 'Comment'
                },
            },
        }],
    })
}

'use server'
import styles from './page.module.scss'
import NotificationSettings from './notificationSettings'
import { getProfileForUserPage } from '@/app/users/[username]/(user-pages)/getProfileForUserPage'
import { readNotificationChannelsAction } from '@/services/notifications/channel/actions'
import { readNotificationSubscriptionsAction } from '@/services/notifications/subscription/actions'
import type { PropTypes } from '@/app/users/[username]/page'

export default async function Notififcations({ params }: PropTypes) {
    const { profile } = await getProfileForUserPage(await params, 'notifications')

    const [channels, subscriptions] = await Promise.all([
        readNotificationChannelsAction(),
        readNotificationSubscriptionsAction({
            params: {
                userId: profile.user.id
            },
        }),
    ])

    if (!channels.success || !subscriptions.success) {
        throw new Error('Kunne ikke laste kanaler eller abonnementer')
    }

    return (
        <div className={styles.wrapper}>
            <h2>Notifikasjoner</h2>
            <NotificationSettings user={profile.user} channels={channels.data} subscriptions={subscriptions.data} />
        </div>
    )
}

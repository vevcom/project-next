'use server'
import NotificaionForm from './notificationForm'
import PageWrapper from '@/components/PageWrapper/PageWrapper'
import { readNotificationChannelsAction } from '@/services/notifications/channel/actions'
import { unwrapActionReturn } from '@/app/redirectToErrorPage'
import { authorizeAdminPage } from '@/app/admin/authorizeAdminPage'


export default async function SendNotification() {
    await authorizeAdminPage('send-notification')
    const channels = unwrapActionReturn(await readNotificationChannelsAction())

    return <PageWrapper
        title="Send varsel"
    >
        <NotificaionForm channels={channels}/>
    </PageWrapper>
}

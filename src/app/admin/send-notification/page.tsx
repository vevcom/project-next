import NotificaionForm from './notificationForm'
import PageWrapper from '@/components/PageWrapper/PageWrapper'
import { notificationChannelOperations } from '@/services/notifications/channel/operations'
import { serverPage } from '@/app/serverPage'

const { page, generateMetadata } = serverPage({
    operation: async () => notificationChannelOperations.readMany({}),
    metadata: () => ({ title: 'Send varsel' }),
    render: ({ data: channels }) => (
        <PageWrapper>
            <NotificaionForm channels={channels}/>
        </PageWrapper>
    ),
})

export default page
export { generateMetadata }

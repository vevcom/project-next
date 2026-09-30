import MailForm from './mailForm'
import PageWrapper from '@/components/PageWrapper/PageWrapper'
import { notificationAuth } from '@/services/notifications/auth'
import { serverPage } from '@/app/serverPage'
import type { PageOperationArgs } from '@/app/serverPage'

const { page, generateMetadata } = serverPage({
    // The page reads nothing - the operation only gates it.
    operation: async ({ session }: PageOperationArgs) => {
        notificationAuth.sendMail.dynamicFields({}).auth(session).requireAuthorized()
        return null
    },
    metadata: () => ({ title: 'Elektronisk postutsendelse' }),
    render: () => (
        <PageWrapper>
            <MailForm />
        </PageWrapper>
    ),
})

export default page
export { generateMetadata }

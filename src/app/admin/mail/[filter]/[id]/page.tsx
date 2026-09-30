import MailFlow from './MailFlow'
import styles from './page.module.scss'
import EditMailAlias from './(editComponents)/mailAlias'
import EditMailingList from './(editComponents)/mailingList'
import EditMailAddressExternal from './(editComponents)/mailAddressExternal'
import EditUser from './(editComponents)/user'
import EditGroup from './(editComponents)/group'
import { mailOperations } from '@/services/mail/operations'
import { MailListTypeArray } from '@/services/mail/types'
import PageWrapper from '@/components/PageWrapper/PageWrapper'
import { serverPage } from '@/app/serverPage'
import { notFound } from 'next/navigation'
import type { PageOperationArgs } from '@/app/serverPage'
import type { MailListTypes } from '@/services/mail/types'

const { page, generateMetadata } = serverPage({
    operation: async ({ params }: PageOperationArgs<{ filter: string, id: string }>) => {
        if (!MailListTypeArray.includes(params.filter as MailListTypes)) {
            notFound()
        }

        const id = Number(params.id)
        if (!id || id <= 0) {
            notFound()
        }

        const filter = params.filter as MailListTypes

        const [results, mailOptions] = await Promise.all([
            mailOperations.readMailTraversal({ params: { filter, id } }),
            mailOperations.readMailOptions({}),
        ])

        return { filter, id, results, mailOptions }
    },
    metadata: () => ({ title: 'Innkommende elektronisk post' }),
    render: ({ data }) => {
        const { filter, id, results, mailOptions } = data

        return <PageWrapper>
            <div className={styles.editContainer}>
                {filter === 'mailingList' ? <EditMailingList
                    id={id}
                    data={results}
                    mailaliases={mailOptions.alias}
                    mailAddressExternal={mailOptions.mailaddressExternal}
                /> : null}
                {filter === 'alias' ? <EditMailAlias
                    id={id}
                    data={results}
                    mailingLists={mailOptions.mailingList}
                /> : null}
                {filter === 'mailaddressExternal' ? <EditMailAddressExternal
                    id={id}
                    data={results}
                    mailingLists={mailOptions.mailingList}
                /> : null}
                {filter === 'user' ? <EditUser
                    id={id}
                    data={results}
                    mailingLists={mailOptions.mailingList}
                /> : null}
                {filter === 'group' ? <EditGroup
                    id={id}
                    data={results}
                    mailingLists={mailOptions.mailingList}
                /> : null}
            </div>
            <MailFlow filter={filter} id={id} data={results} />
        </PageWrapper>
    },
})

export default page
export { generateMetadata }

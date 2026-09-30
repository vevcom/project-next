import styles from './page.module.scss'
import CreateMailAlias from './createMailAliasForm'
import CreateMailingList from './createMailingListForm'
import CreateMailaddressExternal from './createMailaddressExternalForm'
import MailListView from './mailListView'
import PageWrapper from '@/components/PageWrapper/PageWrapper'
import { aliasOperations } from '@/services/mail/alias/operations'
import { mailingListOperations } from '@/services/mail/list/operations'
import { mailAddressExternalOperations } from '@/services/mail/mailAddressExternal/operations'
import { mailAliasAuth } from '@/services/mail/alias/auth'
import { mailingListAuth } from '@/services/mail/list/auth'
import { mailAddressExternalAuth } from '@/services/mail/mailAddressExternal/auth'
import { serverPage } from '@/app/serverPage'

const { page, generateMetadata } = serverPage({
    operation: async () => {
        const [mailAliases, mailingLists, mailAddressesExternal] = await Promise.all([
            aliasOperations.readMany({}),
            mailingListOperations.readMany({}),
            mailAddressExternalOperations.readMany({}),
        ])
        return { mailAliases, mailingLists, mailAddressesExternal }
    },
    authCheckers: {
        canCreateMailAlias: () => mailAliasAuth.create.dynamicFields({}),
        canCreateMailingList: () => mailingListAuth.create.dynamicFields({}),
        canCreateMailaddressExternal: () => mailAddressExternalAuth.create.dynamicFields({}),
    },
    metadata: () => ({ title: 'Innkommende elektronisk post' }),
    render: ({ data, authChecks }) => {
        const showAdminPanel = authChecks.canCreateMailAlias.authorized
            || authChecks.canCreateMailingList.authorized
            || authChecks.canCreateMailaddressExternal.authorized

        return (
            <PageWrapper>
                {showAdminPanel && <div className={styles.adminContainer}>
                    {authChecks.canCreateMailAlias.authorized ? <div>
                        <CreateMailAlias />
                    </div> : null }
                    {authChecks.canCreateMailingList.authorized ? <div>
                        <CreateMailingList />
                    </div> : null }
                    { authChecks.canCreateMailaddressExternal.authorized ? <div>
                        <CreateMailaddressExternal />
                    </div> : null }
                </div>}


                <MailListView
                    mailAliases={data.mailAliases}
                    mailingLists={data.mailingLists}
                    mailAddressesExternal={data.mailAddressesExternal}
                />
            </PageWrapper>
        )
    },
})

export default page
export { generateMetadata }

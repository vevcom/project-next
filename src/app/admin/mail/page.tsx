import styles from './page.module.scss'
import CreateMailAlias from './createMailAliasForm'
import CreateMailingList from './createMailingListForm'
import CreateMailaddressExternal from './createMailaddressExternalForm'
import MailListView from './mailListView'
import PageWrapper from '@/components/PageWrapper/PageWrapper'
import { readMailAliasesAction } from '@/services/mail/alias/actions'
import { readMailingListsAction } from '@/services/mail/list/actions'
import { readMailAddressExternalAction } from '@/services/mail/mailAddressExternal/actions'
import { mailAliasAuth } from '@/services/mail/alias/auth'
import { mailingListAuth } from '@/services/mail/list/auth'
import { mailAddressExternalAuth } from '@/services/mail/mailAddressExternal/auth'
import { unwrapActionReturn } from '@/app/redirectToErrorPage'
import { authorizeAdminPage } from '@/app/admin/authorizeAdminPage'

export default async function MailSettings() {
    const session = await authorizeAdminPage('mail')

    const createMailAlias = mailAliasAuth.create.auth(session).authorized
    const createMailingList = mailingListAuth.create.auth(session).authorized
    const createMailaddressExternal = mailAddressExternalAuth.create.auth(session).authorized

    const showAdminPanel = createMailAlias || createMailingList || createMailaddressExternal

    const [
        mailAliases,
        mailingLists,
        mailAddressesExternal,
    ] = await Promise.all([
        readMailAliasesAction().then(unwrapActionReturn),
        readMailingListsAction().then(unwrapActionReturn),
        readMailAddressExternalAction().then(unwrapActionReturn),
    ])

    return (
        <PageWrapper
            title="Innkommende elektronisk post"
        >
            {showAdminPanel && <div className={styles.adminContainer}>
                {createMailAlias ? <div>
                    <CreateMailAlias />
                </div> : null }
                {createMailingList ? <div>
                    <CreateMailingList />
                </div> : null }
                { createMailaddressExternal ? <div>
                    <CreateMailaddressExternal />
                </div> : null }
            </div>}


            <MailListView
                mailAliases={mailAliases}
                mailingLists={mailingLists}
                mailAddressesExternal={mailAddressesExternal}
            />
        </PageWrapper>
    )
}

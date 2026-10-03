import styles from './page.module.scss'
import CreateMailAlias from '@/app/admin/mail/createMailAliasForm'
import CreateMailingList from '@/app/admin/mail/createMailingListForm'
import CreateMailaddressExternal from '@/app/admin/mail/createMailaddressExternalForm'
import { authorizeAdminPage } from '@/app/admin/authorizeAdminPage'
import { unwrapActionReturn } from '@/app/redirectToErrorPage'
import PageWrapper from '@/components/PageWrapper/PageWrapper'
import { readMailAliasesAction } from '@/services/mail/alias/actions'
import { readMailingListsAction } from '@/services/mail/list/actions'
import { readMailAddressExternalAction } from '@/services/mail/mailAddressExternal/actions'
import { mailAliasAuth } from '@/services/mail/alias/auth'
import { mailingListAuth } from '@/services/mail/list/auth'
import { mailAddressExternalAuth } from '@/services/mail/mailAddressExternal/auth'
import Link from 'next/link'
import { notFound } from 'next/navigation'

type PropTypes = {
    params: Promise<{
        filter: string,
    }>
}

/** The parts of the mail server that have their own admin page. */
const mailParts = {
    alias: {
        title: 'E-postalias',
        intro: 'Adressene det kan sendes e-post til. Et alias videresender alt det mottar til e-postlistene sine.',
    },
    mailingList: {
        title: 'E-postlister',
        intro: 'Bindeleddet i mailtjeneren. En e-postliste mottar e-post fra aliasene sine og'
            + ' videresender den til grupper, brukere og eksterne adresser.',
    },
    mailaddressExternal: {
        title: 'Eksterne e-postadresser',
        intro: 'Mottakere utenfor nettsiden som kan settes på e-postlister.',
    },
} as const

export default async function MailPartPage({ params }: PropTypes) {
    const { filter } = await params
    if (!(filter in mailParts)) notFound()
    const part = mailParts[filter as keyof typeof mailParts]

    // Each part has its own nav link, so each part page is guarded by exactly that link's
    // authorizers - the filter is validated above, so the nav entry always exists.
    const session = await authorizeAdminPage(`mail/${filter}`)

    const [items, canCreate] = await (async () => {
        if (filter === 'alias') {
            const aliases = unwrapActionReturn(await readMailAliasesAction())
            return [
                aliases.map(alias => ({ id: alias.id, label: alias.address, description: alias.description })),
                mailAliasAuth.create.dynamicFields({}).auth(session).authorized,
            ] as const
        }
        if (filter === 'mailingList') {
            const lists = unwrapActionReturn(await readMailingListsAction())
            return [
                lists.map(list => ({ id: list.id, label: list.name, description: list.description })),
                mailingListAuth.create.dynamicFields({}).auth(session).authorized,
            ] as const
        }
        const externals = unwrapActionReturn(await readMailAddressExternalAction())
        return [
            externals.map(external => (
                { id: external.id, label: external.address, description: external.description ?? '' }
            )),
            mailAddressExternalAuth.create.dynamicFields({}).auth(session).authorized,
        ] as const
    })()

    return <PageWrapper title={part.title}>
        <div className={styles.wrapper}>
            <p className={styles.intro}>{part.intro}</p>
            <div className={styles.content}>
                <ul className={styles.itemList}>
                    {items.map(item => <li key={item.id}>
                        <Link href={`/admin/mail/${filter}/${item.id}`} className={styles.itemCard}>
                            <strong>{item.label}</strong>
                            {item.description && <span>{item.description}</span>}
                        </Link>
                    </li>)}
                    {items.length === 0 && <li className={styles.empty}>Ingen enda.</li>}
                </ul>
                {canCreate && <aside className={styles.createPanel}>
                    {filter === 'alias' && <CreateMailAlias />}
                    {filter === 'mailingList' && <CreateMailingList />}
                    {filter === 'mailaddressExternal' && <CreateMailaddressExternal />}
                </aside>}
            </div>
        </div>
    </PageWrapper>
}

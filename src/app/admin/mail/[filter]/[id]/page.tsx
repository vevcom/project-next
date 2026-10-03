import MailFlow from './MailFlow'
import styles from './page.module.scss'
import EditMailAlias from './(editComponents)/mailAlias'
import EditMailingList from './(editComponents)/mailingList'
import EditMailAddressExternal from './(editComponents)/mailAddressExternal'
import EditUser from './(editComponents)/user'
import EditGroup from './(editComponents)/group'
import { readMailOptions, readMailFlowAction } from '@/services/mail/actions'
import { MailListTypeArray } from '@/services/mail/types'
import { readExpandedGroupsOfAllTypesAction } from '@/services/groups/actions'
import { flattenExpandedGroups } from '@/services/groups/flattenExpandedGroups'
import { unwrapActionReturn } from '@/app/redirectToErrorPage'
import PageWrapper from '@/components/PageWrapper/PageWrapper'
import UserSelectionProvider from '@/contexts/UserSelection'
import { UserPagingProvider } from '@/contexts/paging/UserPaging'
import { notFound } from 'next/navigation'
import type { MailFlowObject, MailListTypes } from '@/services/mail/types'

type PropTypes = {
    params: Promise<{
        filter: string,
        id: string,
    }>
}

const typeDisplayNames: Record<MailListTypes, string> = {
    alias: 'E-postalias',
    mailingList: 'E-postliste',
    group: 'Gruppe',
    user: 'Bruker',
    mailaddressExternal: 'Ekstern e-postadresse',
}

function focusedLabel(filter: MailListTypes, id: number, data: MailFlowObject, groupNames: Record<number, string>) {
    if (filter === 'alias') return data.alias.find(alias => alias.id === id)?.address
    if (filter === 'mailingList') return data.mailingList.find(list => list.id === id)?.name
    if (filter === 'mailaddressExternal') return data.mailaddressExternal.find(external => external.id === id)?.address
    if (filter === 'group') return groupNames[id]
    const user = data.user.find(focusedUser => focusedUser.id === id)
    return user && `${user.firstname} ${user.lastname}`
}

export default async function MailFlowPage({ params }: PropTypes) {
    const { filter: rawFilter, id: rawId } = await params
    if (!MailListTypeArray.includes(rawFilter as MailListTypes)) {
        notFound()
    }
    const filter = rawFilter as MailListTypes

    const id = Number(rawId)
    if (!id || id <= 0) {
        notFound()
    }

    const [results, mailOptions, allGroupTypes] = await Promise.all([
        readMailFlowAction({ params: { filter, id } }),
        readMailOptions(),
        readExpandedGroupsOfAllTypesAction(),
    ])

    if (!results.success && results.errorCode === 'NOT FOUND') {
        notFound()
    } else if (!results.success || !mailOptions.success) {
        throw new Error('Kunne ikke hente e-postflyt')
    }

    const groups = flattenExpandedGroups(unwrapActionReturn(allGroupTypes))
    const groupNames = Object.fromEntries(groups.map(group => [group.id, group.name]))

    return <PageWrapper
        title={focusedLabel(filter, id, results.data, groupNames) ?? typeDisplayNames[filter]}
    >
        <div className={styles.wrapper}>
            <p className={styles.typeTag}>{typeDisplayNames[filter]}</p>

            <MailFlow filter={filter} id={id} data={results.data} groupNames={groupNames} />

            <div className={styles.editContainer}>
                {filter === 'mailingList' && <UserSelectionProvider>
                    <UserPagingProvider
                        startPage={{ page: 0, pageSize: 50 }}
                        serverRenderedData={[]}
                        details={{ partOfName: '', groups: [] }}
                    >
                        <EditMailingList
                            id={id}
                            data={results.data}
                            mailaliases={mailOptions.data.alias}
                            mailAddressExternal={mailOptions.data.mailaddressExternal}
                            groups={groups}
                        />
                    </UserPagingProvider>
                </UserSelectionProvider>}
                {filter === 'alias' && <EditMailAlias
                    id={id}
                    data={results.data}
                    mailingLists={mailOptions.data.mailingList}
                />}
                {filter === 'mailaddressExternal' && <EditMailAddressExternal
                    id={id}
                    data={results.data}
                    mailingLists={mailOptions.data.mailingList}
                />}
                {filter === 'user' && <EditUser
                    id={id}
                    data={results.data}
                    mailingLists={mailOptions.data.mailingList}
                />}
                {filter === 'group' && <EditGroup
                    id={id}
                    data={results.data}
                    mailingLists={mailOptions.data.mailingList}
                />}
            </div>
        </div>
    </PageWrapper>
}

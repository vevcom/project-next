import CreateCommitteeForm from './CreateCommitteeForm'
import { readAllCommitteesAction, readCommitteesExpandedAction } from '@/services/groups/committees/actions'
import { readCurrentOmegaOrderAction } from '@/services/omegaOrder/actions'
import { committeeAuth } from '@/services/groups/committees/auth'
import { unwrapActionReturn } from '@/app/redirectToErrorPage'
import { ServerSession } from '@/auth/session/ServerSession'
import PageWrapper from '@/components/PageWrapper/PageWrapper'
import GroupTypeTable from '@/components/Group/GroupTypeTable'
import { AddHeaderItemPopUp } from '@/components/HeaderItems/HeaderItemPopUp'

export default async function AdminCommittee() {
    const session = await ServerSession.fromNextAuth()
    committeeAuth.readExpanded.dynamicFields({}).auth(session)
        .redirectOnUnauthorized({ returnUrl: '/admin/committees' })

    const [committees, expandedGroups, currentOrder] = await Promise.all([
        readAllCommitteesAction().then(unwrapActionReturn),
        readCommitteesExpandedAction().then(unwrapActionReturn),
        readCurrentOmegaOrderAction().then(unwrapActionReturn),
    ])

    const canCreate = committeeAuth.create.dynamicFields({}).auth(session).authorized

    const rows = committees.flatMap(committee => {
        const expanded = expandedGroups.find(group => group.id === committee.groupId)
        return expanded ? [{
            key: committee.id,
            name: committee.name,
            order: expanded.order,
            members: expanded.members,
            pensioned: committee.pensioned,
            href: `/committees/${committee.shortName}/admin`,
        }] : []
    })

    return (
        <PageWrapper
            title="Komitéer"
            headerItem={canCreate && (
                <AddHeaderItemPopUp popUpKey="create committee">
                    <CreateCommitteeForm />
                </AddHeaderItemPopUp>
            )}
        >
            <GroupTypeTable rows={rows} currentOrder={currentOrder.order} emptyText="Ingen komitéer" />
        </PageWrapper>
    )
}

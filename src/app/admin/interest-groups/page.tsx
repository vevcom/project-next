import { readInterestGroupsAction, readInterestGroupsExpandedAction } from '@/services/groups/interestGroups/actions'
import { readCurrentOmegaOrderAction } from '@/services/omegaOrder/actions'
import { interestGroupAuth } from '@/services/groups/interestGroups/auth'
import { unwrapActionReturn } from '@/app/redirectToErrorPage'
import { ServerSession } from '@/auth/session/ServerSession'
import PageWrapper from '@/components/PageWrapper/PageWrapper'
import GroupTypeTable from '@/components/Group/GroupTypeTable'

export default async function AdminInterestGroups() {
    const session = await ServerSession.fromNextAuth()
    interestGroupAuth.readExpanded.dynamicFields({}).auth(session)
        .redirectOnUnauthorized({ returnUrl: '/admin/interest-groups' })

    const [interestGroups, expandedGroups, currentOrder] = await Promise.all([
        readInterestGroupsAction().then(unwrapActionReturn),
        readInterestGroupsExpandedAction().then(unwrapActionReturn),
        readCurrentOmegaOrderAction().then(unwrapActionReturn),
    ])

    const rows = interestGroups.flatMap(interestGroup => {
        const expanded = expandedGroups.find(group => group.id === interestGroup.groupId)
        return expanded ? [{
            key: interestGroup.id,
            name: interestGroup.name,
            order: expanded.order,
            members: expanded.members,
            href: `/interest-groups/${interestGroup.id}`,
        }] : []
    })

    return (
        <PageWrapper title="Interessegrupper">
            <GroupTypeTable rows={rows} currentOrder={currentOrder.order} emptyText="Ingen interessegrupper" />
        </PageWrapper>
    )
}

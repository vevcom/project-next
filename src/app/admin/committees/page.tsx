import CreateCommitteeForm from './CreateCommitteeForm'
import { committeeOperations } from '@/services/groups/committees/operations'
import { omegaOrderOperations } from '@/services/omegaOrder/operations'
import { committeeAuth } from '@/services/groups/committees/auth'
import { serverPage } from '@/app/serverPage'
import PageWrapper from '@/components/PageWrapper/PageWrapper'
import GroupTypeTable from '@/components/Group/GroupTypeTable'
import { AddHeaderItemPopUp } from '@/components/HeaderItems/HeaderItemPopUp'

const { page, generateMetadata } = serverPage({
    operation: async () => {
        const [committees, expandedGroups, currentOrder] = await Promise.all([
            committeeOperations.readAll({}),
            committeeOperations.readExpanded({}),
            omegaOrderOperations.readCurrent({}),
        ])
        return { committees, expandedGroups, currentOrder }
    },
    authCheckers: {
        canCreate: () => committeeAuth.create.dynamicFields({}),
    },
    metadata: () => ({ title: 'Komitéer' }),
    render: ({ data, authChecks }) => {
        const rows = data.committees.flatMap(committee => {
            const expanded = data.expandedGroups.find(group => group.id === committee.groupId)
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
                headerItem={authChecks.canCreate.authorized && (
                    <AddHeaderItemPopUp popUpKey="create committee">
                        <CreateCommitteeForm />
                    </AddHeaderItemPopUp>
                )}
            >
                <GroupTypeTable rows={rows} currentOrder={data.currentOrder.order} emptyText="Ingen komitéer" />
            </PageWrapper>
        )
    },
})

export default page
export { generateMetadata }

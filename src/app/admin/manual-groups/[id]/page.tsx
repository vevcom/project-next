import styles from './page.module.scss'
import {
    addManualGroupMembersAction,
    migrateManualGroupAction,
    removeManualGroupMembersAction,
    setManualGroupMemberAdminAction,
    setManualGroupMemberTitleAction,
    pensionManualGroupAction,
} from '@/services/groups/manualGroups/actions'
import { manualGroupOperations } from '@/services/groups/manualGroups/operations'
import { omegaOrderOperations } from '@/services/omegaOrder/operations'
import { manualGroupAuth } from '@/services/groups/manualGroups/auth'
import { serverPage } from '@/app/serverPage'
import PageWrapper from '@/components/PageWrapper/PageWrapper'
import MigrateGroup from '@/components/Group/MigrateGroup'
import ManageGroupMembers from '@/components/Group/ManageGroupMembers'
import PensionGroup from '@/components/Group/PensionGroup'
import { groupMembersByOrder } from '@/components/Group/groupMembersByOrder'
import { notFound } from 'next/navigation'
import type { PageOperationArgs } from '@/app/serverPage'

const { page, generateMetadata } = serverPage({
    operation: async ({ params, session }: PageOperationArgs<{ id: string }>) => {
        const id = Number(params.id)
        if (!Number.isInteger(id)) notFound()

        const manualGroup = await manualGroupOperations.read({ params: { id } })

        // The page reads the group's members, so it guards on `readMembers` rather than `read`:
        // `MANUAL_GROUP_READ` is a default permission, held by a visitor with no session at all.
        manualGroupAuth.readMembers.dynamicFields({ groupId: manualGroup.groupId })
            .auth(session).requireAuthorized()

        const [expandedGroups, members, currentOrder] = await Promise.all([
            manualGroupOperations.readExpanded({}),
            manualGroupOperations.readMembers({ params: { groupId: manualGroup.groupId } }),
            omegaOrderOperations.readCurrent({}),
        ])

        const expanded = expandedGroups.find(group => group.id === manualGroup.groupId)
        if (!expanded) notFound()

        return { manualGroup, expanded, members, currentOrder }
    },
    authCheckers: {
        canMigrate: (data) => manualGroupAuth.migrateGroup.dynamicFields({ groupId: data.manualGroup.groupId }),
        canAddMembers: (data) => manualGroupAuth.addMembers.dynamicFields({ groupId: data.manualGroup.groupId }),
        canSetMemberAdmin: (data) => manualGroupAuth.setMemberAdmin.dynamicFields({ groupId: data.manualGroup.groupId }),
        canSetMemberTitle: (data) => manualGroupAuth.setMemberTitle.dynamicFields({
            groupId: data.manualGroup.groupId,
        }),
        canPension: () => manualGroupAuth.pension.dynamicFields({}),
        canRemoveMembers: (data) => manualGroupAuth.removeMembers.dynamicFields({ groupId: data.manualGroup.groupId }),
    },
    metadata: (data) => ({ title: data.manualGroup.name }),
    render: ({ data, authChecks }) => {
        const { manualGroup, expanded, members, currentOrder } = data

        // Only the active members of the group's own order can be carried into the next one.
        const membersOfGroupOrder = members.filter(
            member => member.active && member.order === expanded.order
        )

        return (
            <PageWrapper>
                <div className={styles.wrapper}>
                    <div className={styles.facts}>
                        <span>Kortnavn: {manualGroup.shortName}</span>
                        <span>Orden: {expanded.order}</span>
                        <span>Aktive medlemmer: {expanded.members}</span>
                    </div>

                    {authChecks.canPension.authorized && (
                        <div className={styles.section}>
                            <h2>Pensjonering</h2>
                            <PensionGroup
                                groupId={manualGroup.groupId}
                                groupName={manualGroup.name}
                                pensioned={manualGroup.pensioned}
                                currentOmegaOrder={currentOrder.order}
                                pensionGroupAction={pensionManualGroupAction}
                            />
                        </div>
                    )}

                    {!manualGroup.pensioned
                        && (authChecks.canAddMembers.authorized || authChecks.canRemoveMembers.authorized) && (
                        <div className={styles.section}>
                            <h2>Medlemmer</h2>
                            <ManageGroupMembers
                                groupId={manualGroup.groupId}
                                groupOrder={expanded.order}
                                orders={groupMembersByOrder(members, expanded.order)}
                                addMembersAction={
                                    authChecks.canAddMembers.authorized ? addManualGroupMembersAction : undefined
                                }
                                setMemberAdminAction={
                                    authChecks.canSetMemberAdmin.authorized ? setManualGroupMemberAdminAction : undefined
                                }
                                setMemberTitleAction={
                                    authChecks.canSetMemberTitle.authorized ? setManualGroupMemberTitleAction : undefined
                                }
                                removeMembersAction={
                                    authChecks.canRemoveMembers.authorized ? removeManualGroupMembersAction : undefined
                                }
                            />
                        </div>
                    )}

                    {!manualGroup.pensioned && authChecks.canMigrate.authorized && (
                        <div className={styles.section}>
                            <h2>Migrering</h2>
                            <MigrateGroup
                                groupId={manualGroup.groupId}
                                groupOrder={expanded.order}
                                currentOmegaOrder={currentOrder.order}
                                candidates={membersOfGroupOrder.map(member => ({
                                    userId: member.userId,
                                    name: `${member.user.firstname} ${member.user.lastname}`,
                                    title: member.title,
                                    admin: member.admin,
                                }))}
                                migrateGroupAction={migrateManualGroupAction}
                            />
                        </div>
                    )}
                </div>
            </PageWrapper>
        )
    },
})

export default page
export { generateMetadata }

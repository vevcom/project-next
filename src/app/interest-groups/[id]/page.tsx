import styles from './page.module.scss'
import {
    addInterestGroupMembersAction,
    migrateInterestGroupAction,
    readInterestGroupAction,
    readInterestGroupMembersAction,
    readInterestGroupsExpandedAction,
    removeInterestGroupMembersAction,
    setInterestGroupMemberAdminAction,
    setInterestGroupMemberTitleAction,
} from '@/services/groups/interestGroups/actions'
import { readCurrentOmegaOrderAction } from '@/services/omegaOrder/actions'
import { interestGroupAuth } from '@/services/groups/interestGroups/auth'
import { unwrapActionReturn } from '@/app/redirectToErrorPage'
import { ServerSession } from '@/auth/session/ServerSession'
import PageWrapper from '@/components/PageWrapper/PageWrapper'
import MigrateGroup from '@/components/Group/MigrateGroup'
import ManageGroupMembers from '@/components/Group/ManageGroupMembers'
import { groupMembersByOrder } from '@/components/Group/groupMembersByOrder'
import UserCard from '@/components/User/UserCard'
import { notFound } from 'next/navigation'

type PropTypes = {
    params: Promise<{
        id: string
    }>
}

export default async function InterestGroupMembers({ params }: PropTypes) {
    const id = Number((await params).id)
    if (!Number.isInteger(id)) notFound()

    const interestGroup = unwrapActionReturn(await readInterestGroupAction({ params: { id } }))
    const [members, expandedGroups, currentOrder] = await Promise.all([
        readInterestGroupMembersAction({ params: { groupId: interestGroup.groupId } })
            .then(unwrapActionReturn),
        readInterestGroupsExpandedAction().then(unwrapActionReturn),
        readCurrentOmegaOrderAction().then(unwrapActionReturn),
    ])

    const expanded = expandedGroups.find(group => group.id === interestGroup.groupId)
    const session = await ServerSession.fromNextAuth()
    const canMigrate = interestGroupAuth.migrateGroup.dynamicFields({
        groupId: interestGroup.groupId,
    }).auth(session).authorized
    const canAddMembers = interestGroupAuth.addMembers.dynamicFields({
        groupId: interestGroup.groupId,
    }).auth(session).authorized
    const canSetMemberAdmin = interestGroupAuth.setMemberAdmin.dynamicFields({
        groupId: interestGroup.groupId,
    }).auth(session).authorized
    const canSetMemberTitle = interestGroupAuth.setMemberTitle.dynamicFields({
        groupId: interestGroup.groupId,
    }).auth(session).authorized
    const canRemoveMembers = interestGroupAuth.removeMembers.dynamicFields({
        groupId: interestGroup.groupId,
    }).auth(session).authorized

    const activeMembersOfGroupOrder = members.filter(
        member => member.active && member.order === expanded?.order
    )

    // Memberships are kept per order, so the list is grouped by the order they belong to - the
    // current order first, then the history below it.
    const membersByOrder = members.reduce((acc, member) => {
        acc[member.order] = [...(acc[member.order] ?? []), member]
        return acc
    }, {} as Record<number, typeof members>)

    const ordersDescending = Object.keys(membersByOrder)
        .map(order => parseInt(order, 10))
        .sort((orderOne, orderTwo) => orderTwo - orderOne)

    return (
        <PageWrapper title={interestGroup.name}>
            {expanded && (canAddMembers || canRemoveMembers) && (
                <div className={styles.management}>
                    <h2>Administrer medlemmer</h2>
                    <ManageGroupMembers
                        groupId={interestGroup.groupId}
                        groupOrder={expanded.order}
                        orders={groupMembersByOrder(members, expanded.order)}
                        addMembersAction={canAddMembers ? addInterestGroupMembersAction : undefined}
                        setMemberAdminAction={canSetMemberAdmin ? setInterestGroupMemberAdminAction : undefined}
                        setMemberTitleAction={canSetMemberTitle ? setInterestGroupMemberTitleAction : undefined}
                        removeMembersAction={canRemoveMembers ? removeInterestGroupMembersAction : undefined}
                    />
                </div>
            )}
            {canMigrate && expanded && (
                <div className={styles.migration}>
                    <h2>Migrering</h2>
                    <MigrateGroup
                        groupId={interestGroup.groupId}
                        groupOrder={expanded.order}
                        currentOmegaOrder={currentOrder.order}
                        candidates={activeMembersOfGroupOrder.map(member => ({
                            userId: member.userId,
                            name: `${member.user.firstname} ${member.user.lastname}`,
                            title: member.title,
                            admin: member.admin,
                        }))}
                        migrateGroupAction={migrateInterestGroupAction}
                    />
                </div>
            )}

            <h2>Medlemmer</h2>
            {ordersDescending.length === 0 && <p className={styles.empty}>Ingen medlemmer</p>}
            {ordersDescending.map(order => (
                <div key={order}>
                    <h3 className={styles.orderHeading}>{order}. Orden</h3>
                    <hr />
                    <div className={styles.memberList}>
                        {membersByOrder[order].map(member => (
                            <UserCard
                                key={member.userId}
                                user={member.user}
                                subText={member.active ? member.title : `${member.title} (inaktiv)`}
                            />
                        ))}
                    </div>
                </div>
            ))}
        </PageWrapper>
    )
}

import styles from './page.module.scss'
import {
    addManualGroupMembersAction,
    migrateManualGroupAction,
    readManualGroupAction,
    readManualGroupMembersAction,
    readManualGroupsExpandedAction,
    removeManualGroupMembersAction,
    setManualGroupMemberAdminAction,
    setManualGroupMemberTitleAction,
    pensionManualGroupAction,
} from '@/services/groups/manualGroups/actions'
import { readCurrentOmegaOrderAction } from '@/services/omegaOrder/actions'
import { manualGroupAuth } from '@/services/groups/manualGroups/auth'
import { unwrapActionReturn } from '@/app/redirectToErrorPage'
import { ServerSession } from '@/auth/session/ServerSession'
import PageWrapper from '@/components/PageWrapper/PageWrapper'
import MigrateGroup from '@/components/Group/MigrateGroup'
import ManageGroupMembers from '@/components/Group/ManageGroupMembers'
import PensionGroup from '@/components/Group/PensionGroup'
import { groupMembersByOrder } from '@/components/Group/groupMembersByOrder'
import { notFound } from 'next/navigation'

type PropTypes = {
    params: Promise<{
        id: string
    }>
}

export default async function ManualGroupAdmin({ params }: PropTypes) {
    const id = Number((await params).id)
    if (!Number.isInteger(id)) notFound()

    const session = await ServerSession.fromNextAuth()

    const manualGroup = unwrapActionReturn(await readManualGroupAction({ params: { id } }))

    // The page reads the group's members, so it guards on `readMembers` rather than `read`:
    // `MANUAL_GROUP_USE` is a default permission, held by a visitor with no session at all.
    manualGroupAuth.readMembers.data({ groupId: manualGroup.groupId }).auth(session)
        .redirectOnUnauthorized({ returnUrl: `/admin/manual-groups/${id}` })

    const [expandedGroups, members, currentOrder] = await Promise.all([
        readManualGroupsExpandedAction().then(unwrapActionReturn),
        readManualGroupMembersAction({ params: { groupId: manualGroup.groupId } })
            .then(unwrapActionReturn),
        readCurrentOmegaOrderAction().then(unwrapActionReturn),
    ])

    const expanded = expandedGroups.find(group => group.id === manualGroup.groupId)
    if (!expanded) notFound()

    const canMigrate = manualGroupAuth.migrateGroup.data({ groupId: manualGroup.groupId }).auth(session).authorized
    const canAddMembers = manualGroupAuth.addMembers.data({ groupId: manualGroup.groupId }).auth(session).authorized
    const canSetMemberAdmin = manualGroupAuth.setMemberAdmin.data({ groupId: manualGroup.groupId })
        .auth(session).authorized
    const canSetMemberTitle = manualGroupAuth.setMemberTitle.data({ groupId: manualGroup.groupId })
        .auth(session).authorized
    const canPension = manualGroupAuth.pension.auth(session).authorized
    const canRemoveMembers = manualGroupAuth.removeMembers.data({ groupId: manualGroup.groupId })
        .auth(session).authorized

    // Only the active members of the group's own order can be carried into the next one.
    const membersOfGroupOrder = members.filter(
        member => member.active && member.order === expanded.order
    )

    return (
        <PageWrapper title={manualGroup.name}>
            <div className={styles.wrapper}>
                <div className={styles.facts}>
                    <span>Kortnavn: {manualGroup.shortName}</span>
                    <span>Orden: {expanded.order}</span>
                    <span>Aktive medlemmer: {expanded.members}</span>
                </div>

                {canPension && (
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

                {!manualGroup.pensioned && (canAddMembers || canRemoveMembers) && (
                    <div className={styles.section}>
                        <h2>Medlemmer</h2>
                        <ManageGroupMembers
                            groupId={manualGroup.groupId}
                            groupOrder={expanded.order}
                            orders={groupMembersByOrder(members, expanded.order)}
                            addMembersAction={canAddMembers ? addManualGroupMembersAction : undefined}
                            setMemberAdminAction={canSetMemberAdmin ? setManualGroupMemberAdminAction : undefined}
                            setMemberTitleAction={canSetMemberTitle ? setManualGroupMemberTitleAction : undefined}
                            removeMembersAction={canRemoveMembers ? removeManualGroupMembersAction : undefined}
                        />
                    </div>
                )}

                {!manualGroup.pensioned && canMigrate && (
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
}

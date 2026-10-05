import styles from './page.module.scss'
import getCommittee from '@/app/committees/[shortName]/getCommittee'
import Image from '@/components/Image/Image'
import ImageUploader from '@/components/Image/ImageUploader'
import MigrateGroup from '@/components/Group/MigrateGroup'
import ManageGroupMembers from '@/components/Group/ManageGroupMembers'
import PensionGroup from '@/components/Group/PensionGroup'
import { groupMembersByOrder } from '@/components/Group/groupMembersByOrder'
import { configureAction } from '@/services/configureAction'
import {
    addCommitteeMembersAction,
    migrateCommitteeAction,
    readCommitteeMembersAction,
    readCommitteesExpandedAction,
    removeCommitteeMembersAction,
    setCommitteeMemberAdminAction,
    setCommitteeMemberTitleAction,
    pensionCommitteeAction,
    updateCommitteeLogoAction,
} from '@/services/groups/committees/actions'
import { readCurrentOmegaOrderAction } from '@/services/omegaOrder/actions'
import { readPermissionOfGroupAction } from '@/services/permissions/actions'
import { committeeAuth } from '@/services/groups/committees/auth'
import { unwrapActionReturn } from '@/app/redirectToErrorPage'
import { ServerSession } from '@/auth/session/ServerSession'
import type { PropTypes } from '@/app/committees/[shortName]/page'

export default async function ComitteeAdmin({ params }: PropTypes) {
    const committee = await getCommittee(params)

    const session = await ServerSession.fromNextAuth()
    const canEditLogo = committeeAuth.updateLogo.data({ groupId: committee.groupId }).auth(session)
    const canMigrate = committeeAuth.migrateGroup.data({ groupId: committee.groupId }).auth(session).authorized
    // Granting membership takes the group's permissions. Whoever may not read them may not grant them.
    const groupPermissions = await readPermissionOfGroupAction({ params: { groupId: committee.groupId } })
    const grant = groupPermissions.success && { groupId: committee.groupId, grantedPermissions: groupPermissions.data }
    const canAddMembers = grant && committeeAuth.addMembers.data(grant).auth(session).authorized
    const canSetMemberAdmin = grant && committeeAuth.setMemberAdmin.data(grant).auth(session).authorized
    const canSetMemberTitle = committeeAuth.setMemberTitle.data({ groupId: committee.groupId })
        .auth(session).authorized
    const canRemoveMembers = committeeAuth.removeMembers.data({ groupId: committee.groupId })
        .auth(session).authorized
    const canPension = committeeAuth.pension.auth(session).authorized

    // Every membership, not just the active ones of the current order: the management UI can
    // address any order the committee has memberships in.
    const [expandedGroups, members, currentOrder] = await Promise.all([
        readCommitteesExpandedAction().then(unwrapActionReturn),
        readCommitteeMembersAction({ params: { groupId: committee.groupId } })
            .then(unwrapActionReturn),
        readCurrentOmegaOrderAction().then(unwrapActionReturn),
    ])

    const expanded = expandedGroups.find(group => group.id === committee.groupId)
    // Only the active members of the committee's own order can be carried into the next one.
    const membersOfGroupOrder = members.filter(
        member => member.active && member.order === expanded?.order
    )

    return (
        <div className={styles.wrapper}>
            <header className={styles.pageHeader}>
                <h2>Administrer {committee.name}</h2>
                <div className={styles.facts}>
                    <span>Kortnavn: {committee.shortName}</span>
                    {expanded && <span>Orden: {expanded.order}</span>}
                    {expanded && <span>Aktive medlemmer: {expanded.members}</span>}
                </div>
            </header>

            {!committee.pensioned && <section className={styles.section}>
                <h3>Logo</h3>
                <div className={styles.logo}>
                    <Image image={committee.logoImage} width={300} />
                    {
                        canEditLogo.authorized && (
                            <ImageUploader
                                title="Endre komitelogo"
                                refreshOnSuccess
                                uploadImageAction={configureAction(
                                    updateCommitteeLogoAction,
                                    { params: { shortName: committee.shortName } }
                                )}
                            />
                        )
                    }
                </div>
            </section>}

            {canPension && (
                <section className={styles.section}>
                    <h3>Pensjonering</h3>
                    <PensionGroup
                        groupId={committee.groupId}
                        groupName={committee.name}
                        pensioned={committee.pensioned}
                        currentOmegaOrder={currentOrder.order}
                        pensionGroupAction={pensionCommitteeAction}
                    />
                </section>
            )}

            {!committee.pensioned && expanded && (canAddMembers || canRemoveMembers) && (
                <section className={styles.section}>
                    <h3>Medlemmer</h3>
                    <ManageGroupMembers
                        groupId={committee.groupId}
                        groupOrder={expanded.order}
                        orders={groupMembersByOrder(members, expanded.order)}
                        addMembersAction={canAddMembers ? addCommitteeMembersAction : undefined}
                        setMemberAdminAction={canSetMemberAdmin ? setCommitteeMemberAdminAction : undefined}
                        setMemberTitleAction={canSetMemberTitle ? setCommitteeMemberTitleAction : undefined}
                        removeMembersAction={canRemoveMembers ? removeCommitteeMembersAction : undefined}
                    />
                </section>
            )}

            {!committee.pensioned && canMigrate && expanded && (
                <section className={styles.section}>
                    <h3>Migrering</h3>
                    <MigrateGroup
                        groupId={committee.groupId}
                        groupOrder={expanded.order}
                        currentOmegaOrder={currentOrder.order}
                        candidates={membersOfGroupOrder.map(member => ({
                            userId: member.userId,
                            name: `${member.user.firstname} ${member.user.lastname}`,
                            title: member.title,
                            admin: member.admin,
                        }))}
                        migrateGroupAction={migrateCommitteeAction}
                    />
                </section>
            )}
        </div>
    )
}

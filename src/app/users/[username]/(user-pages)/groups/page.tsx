import styles from './page.module.scss'
import { getProfileForUserPage } from '@/app/users/[username]/(user-pages)/getProfileForUserPage'
import { unwrapActionReturn } from '@/app/redirectToErrorPage'
import SimpleTable from '@/components/Table/SimpleTable'
import { groupTypesConfig } from '@/services/groups/constants'
import { omegaMembershipGroupAuth } from '@/services/groups/omegaMembershipGroups/auth'
import { classAuth } from '@/services/groups/classes/auth'
import { studyProgrammeAuth } from '@/services/groups/studyProgrammes/auth'
import { committeeAuth } from '@/services/groups/committees/auth'
import { interestGroupAuth } from '@/services/groups/interestGroups/auth'
import { manualGroupAuth } from '@/services/groups/manualGroups/auth'
import { readOmegaMembershipGroupMembershipsOfUserAction } from '@/services/groups/omegaMembershipGroups/actions'
import { readClassMembershipsOfUserAction } from '@/services/groups/classes/actions'
import { readStudyProgrammeMembershipsOfUserAction } from '@/services/groups/studyProgrammes/actions'
import { readCommitteeMembershipsOfUserAction } from '@/services/groups/committees/actions'
import { readInterestGroupMembershipsOfUserAction } from '@/services/groups/interestGroups/actions'
import { readManualGroupMembershipsOfUserAction } from '@/services/groups/manualGroups/actions'
import type { PropTypes } from '@/app/users/[username]/page'

export default async function UserGroups({ params }: PropTypes) {
    const { profile, session } = await getProfileForUserPage(await params, 'groups')
    const userId = profile.user.id

    // Each group type guards the memberships in it on its own, so the page shows the types the
    // session may read and leaves the rest out.
    const groupTypes = [
        {
            type: 'OMEGA_MEMBERSHIP_GROUP',
            authorizer: omegaMembershipGroupAuth.readMembershipsOfUser,
            readMemberships: readOmegaMembershipGroupMembershipsOfUserAction,
        },
        { type: 'CLASS', authorizer: classAuth.readMembershipsOfUser, readMemberships: readClassMembershipsOfUserAction },
        {
            type: 'STUDY_PROGRAMME',
            authorizer: studyProgrammeAuth.readMembershipsOfUser,
            readMemberships: readStudyProgrammeMembershipsOfUserAction,
        },
        {
            type: 'COMMITTEE',
            authorizer: committeeAuth.readMembershipsOfUser,
            readMemberships: readCommitteeMembershipsOfUserAction,
        },
        {
            type: 'INTEREST_GROUP',
            authorizer: interestGroupAuth.readMembershipsOfUser,
            readMemberships: readInterestGroupMembershipsOfUserAction,
        },
        {
            type: 'MANUAL_GROUP',
            authorizer: manualGroupAuth.readMembershipsOfUser,
            readMemberships: readManualGroupMembershipsOfUserAction,
        },
    ] as const

    const sections = await Promise.all(groupTypes
        .filter(({ authorizer }) => authorizer.dynamicFields({ userId }).auth(session).authorized)
        .map(async ({ type, readMemberships }) => ({
            type,
            memberships: unwrapActionReturn(await readMemberships({ params: { userId } })),
        })))

    return (
        <div className={styles.wrapper}>
            <h2>Grupper</h2>
            {sections.map(({ type, memberships }) =>
                <section key={type} className={styles.groupType}>
                    <h3>{groupTypesConfig[type].namePlural}</h3>
                    {memberships.length === 0 ? (
                        <p className={styles.empty}>Ingen medlemskap.</p>
                    ) : (
                        <SimpleTable
                            header={['Gruppe', 'Tittel', 'Orden', 'Status', 'Admin']}
                            body={memberships.map(membership => [
                                membership.groupName,
                                membership.title,
                                membership.order,
                                membership.active ? 'Aktiv' : 'Inaktiv',
                                membership.admin ? 'Ja' : 'Nei',
                            ])}
                        />
                    )}
                </section>
            )}
        </div>
    )
}

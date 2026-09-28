import styles from './page.module.scss'
import BumpClasses from './BumpClasses'
import { readClassesAction, readClassesExpandedAction } from '@/services/groups/classes/actions'
import { readCurrentOmegaOrderAction } from '@/services/omegaOrder/actions'
import { classAuth } from '@/services/groups/classes/auth'
import { unwrapActionReturn } from '@/app/redirectToErrorPage'
import { ServerSession } from '@/auth/session/ServerSession'
import PageWrapper from '@/components/PageWrapper/PageWrapper'
import GroupTypeTable from '@/components/Group/GroupTypeTable'
import { CLASS_LEVEL_ORDERING } from '@/services/groups/constants'

export default async function Classes() {
    const session = await ServerSession.fromNextAuth()
    classAuth.readExpanded.dynamicFields({}).auth(session).redirectOnUnauthorized({ returnUrl: '/admin/classes' })

    const [classRows, expandedClasses, currentOrder] = await Promise.all([
        readClassesAction().then(unwrapActionReturn),
        readClassesExpandedAction().then(unwrapActionReturn),
        readCurrentOmegaOrderAction().then(unwrapActionReturn),
    ])
    const canBump = classAuth.bumpClasses.dynamicFields({}).auth(session).authorized

    // The expanded groups carry the name, member count and order; the class rows carry the level.
    // Joining them on the group id lets the table be listed in the order students move through.
    // A class is not administered per group, so no row links anywhere.
    const rows = CLASS_LEVEL_ORDERING.flatMap(level => {
        const classRow = classRows.find(row => row.level === level)
        const expanded = classRow && expandedClasses.find(group => group.id === classRow.groupId)
        return expanded ? [{
            key: level,
            name: expanded.name,
            order: expanded.order,
            members: expanded.members,
        }] : []
    })

    return (
        <PageWrapper title="Klasser">
            <GroupTypeTable rows={rows} currentOrder={currentOrder.order} nameHeading="Klasse" />

            <div className={styles.actions}>
                <p className={styles.explanation}>
                    Klassene følger ordenen til Omega automatisk. Når Omega har blitt inkrementert må
                    klassene rykkes opp: alle studenter flyttes én klasse opp, og uteksaminerte beholder
                    medlemskapet sitt. Dette må gjøres før Omega kan inkrementeres på nytt.
                </p>
                {canBump && <BumpClasses />}
            </div>
        </PageWrapper>
    )
}

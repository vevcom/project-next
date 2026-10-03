import styles from './page.module.scss'
import SelectUserForDots from './SelectUserForDots'
import UserDots from '@/components/Dot/UserDots'
import PageWrapper from '@/components/PageWrapper/PageWrapper'
import UserSelectionProvider from '@/contexts/UserSelection'
import { UserPagingProvider } from '@/contexts/paging/UserPaging'
import { unwrapActionReturn } from '@/app/redirectToErrorPage'
import { authorizeAdminPage } from '@/app/admin/authorizeAdminPage'
import { dotAuth } from '@/services/dots/auth'
import { readDotsForUserAction } from '@/services/dots/actions'
import { readUserAction } from '@/services/users/actions'
import { QueryParams } from '@/lib/queryParams/queryParams'
import Link from 'next/link'
import type { SearchParamsServerSide } from '@/lib/queryParams/types'

type PropTypes = SearchParamsServerSide

export default async function Dots({ searchParams }: PropTypes) {
    const session = await authorizeAdminPage('dots')
    const userId = QueryParams.userId.decode(await searchParams)
    const onlyActive = QueryParams.onlyActive.decode(await searchParams) ?? false

    if (userId === null) {
        return (
            <PageWrapper title="Prikker">
                <div className={styles.wrapper}>
                    <i>Velg brukeren du vil se prikkene til</i>
                    <UserSelectionProvider>
                        <UserPagingProvider
                            startPage={{ page: 0, pageSize: 50 }}
                            serverRenderedData={[]}
                            details={{ partOfName: '', groups: [] }}
                        >
                            <SelectUserForDots />
                        </UserPagingProvider>
                    </UserSelectionProvider>
                </div>
            </PageWrapper>
        )
    }

    const [userReturn, dotsReturn] = await Promise.all([
        readUserAction({ params: { id: userId } }),
        readDotsForUserAction({ params: { userId, onlyActive } }),
    ])
    const user = unwrapActionReturn(userReturn)
    const dots = unwrapActionReturn(dotsReturn)

    // This page is only about administrating dots, so the crud of them is offered outright to
    // whoever is authorized for it - no edit mode to enter first.

    return (
        <PageWrapper title={`Prikker for ${user.firstname} ${user.lastname}`}>
            <div className={styles.wrapper}>
                <div className={styles.actions}>
                    <Link className={styles.action} href="/admin/dots">Velg en annen bruker</Link>
                    <Link className={styles.action} href={
                        `/admin/dots?${QueryParams.userId.encodeUrl(userId)}` +
                        `&${QueryParams.onlyActive.encodeUrl(!onlyActive)}`
                    }>
                        {onlyActive ? 'Vis alle prikker' : 'Vis kun aktive prikker'}
                    </Link>
                </div>
                <UserDots
                    userId={user.id}
                    dots={dots}
                    showCreateForm={
                        dotAuth.create.data({ userId: session.user?.id ?? 0 }).auth(session).authorized
                    }
                    showUpdateForm={dotAuth.update.auth(session).authorized}
                    showDestroyForm={dotAuth.destroy.auth(session).authorized}
                />
            </div>
        </PageWrapper>
    )
}

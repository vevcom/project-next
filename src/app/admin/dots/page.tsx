import styles from './page.module.scss'
import SelectUserForDots from './SelectUserForDots'
import UserDots from '@/components/Dot/UserDots'
import PageWrapper from '@/components/PageWrapper/PageWrapper'
import UserSelectionProvider from '@/contexts/UserSelection'
import { UserPagingProvider } from '@/contexts/paging/UserPaging'
import { dotAuth } from '@/services/dots/auth'
import { dotOperations } from '@/services/dots/operations'
import { userOperations } from '@/services/users/operations'
import { serverPage } from '@/app/serverPage'
import { QueryParams } from '@/lib/queryParams/queryParams'
import Link from 'next/link'
import type { PageOperationArgs } from '@/app/serverPage'

const { page, generateMetadata } = serverPage({
    operation: async ({ searchParams }: PageOperationArgs) => {
        const userId = QueryParams.userId.decode(searchParams)
        const onlyActive = QueryParams.onlyActive.decode(searchParams) ?? false

        if (userId === null) {
            return { userId: null, onlyActive } as const
        }

        const [user, dots] = await Promise.all([
            userOperations.read({ params: { id: userId } }),
            dotOperations.readForUser({ params: { userId, onlyActive } }),
        ])

        return { userId, onlyActive, user, dots } as const
    },
    authCheckers: {
        // This page is only about administrating dots, so the crud of them is offered outright to
        // whoever is authorized for it - no edit mode to enter first. The create authorizer needs
        // the session's own user id, so it is run inline in render rather than declared here.
        canUpdate: () => dotAuth.update.dynamicFields({}),
        canDestroy: () => dotAuth.destroy.dynamicFields({}),
    },
    metadata: (data) => ({
        title: data.userId === null ? 'Prikker' : `Prikker for ${data.user.firstname} ${data.user.lastname}`,
    }),
    render: ({ data, authChecks, session }) => {
        if (data.userId === null) {
            return (
                <PageWrapper>
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

        return (
            <PageWrapper>
                <div className={styles.wrapper}>
                    <div className={styles.actions}>
                        <Link className={styles.action} href="/admin/dots">Velg en annen bruker</Link>
                        <Link className={styles.action} href={
                            `/admin/dots?${QueryParams.userId.encodeUrl(data.userId)}` +
                            `&${QueryParams.onlyActive.encodeUrl(!data.onlyActive)}`
                        }>
                            {data.onlyActive ? 'Vis alle prikker' : 'Vis kun aktive prikker'}
                        </Link>
                    </div>
                    <UserDots
                        userId={data.user.id}
                        dots={data.dots}
                        showCreateForm={
                            dotAuth.create.dynamicFields({ userId: session.user?.id ?? 0 }).auth(session).authorized
                        }
                        showUpdateForm={authChecks.canUpdate.authorized}
                        showDestroyForm={authChecks.canDestroy.authorized}
                    />
                </div>
            </PageWrapper>
        )
    },
})

export default page
export { generateMetadata }

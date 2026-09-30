import styles from './layout.module.scss'
import PageTitleSetter from '@/contexts/PageTitleSetter'
import { userOperations } from '@/services/users/operations'
import { withPageSession } from '@/app/serverPage'
import PageWrapper from '@/components/PageWrapper/PageWrapper'
import UserNavBar from '@/app/users/[username]/UserNavBar'
import { notFound } from 'next/navigation'
import type { ReactNode } from 'react'
import type { PropTypes } from '@/app/users/[username]/page'
import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Innstillinger',
}

export default async function UserAdmin({ children, params }: PropTypes & { children: ReactNode }) {
    const { username, user } = await withPageSession(async (session) => {
        let usernameOfPage = (await params).username
        if (usernameOfPage === 'me') {
            if (!session.user) return notFound()
            usernameOfPage = session.user.username
        }

        // Guards the whole section: a username nobody may read gets no layout and no nav.
        const profile = await userOperations.readProfile({ params: { username: usernameOfPage } })
        return { username: usernameOfPage, user: profile.user }
    })

    return (
        <PageWrapper fillHeight transparent hideTitle>
            <PageTitleSetter title={'Innstillinger'} />
            <div className={styles.userAdminLayout}>
                <main className={styles.main}>
                    <div className={styles.mainInner}>
                        {children}
                    </div>
                </main>
                <UserNavBar username={username} userId={user.id} />
            </div>
        </PageWrapper>
    )
}

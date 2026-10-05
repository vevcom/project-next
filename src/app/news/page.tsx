import styles from './page.module.scss'
import AddNews from './AddNews'
import CurrentNews from './CurrentNews'
import { AddHeaderItemPopUp } from '@/components/HeaderItems/HeaderItemPopUp'
import ArchiveLink from '@/components/HeaderItems/ArchiveLink'
import PageWrapper from '@/components/PageWrapper/PageWrapper'
import { newsAuth } from '@/services/news/auth'
import { ServerSession } from '@/auth/session/ServerSession'

export default async function NewsArtilces() {
    const session = await ServerSession.fromNextAuth()
    const canCreateNews = newsAuth.create.auth(session).authorized

    return (
        <PageWrapper title="Nyheter"
            headerItem={
                <div className={styles.head}>
                    <ArchiveLink href="news/archive" />
                    {
                        canCreateNews && (
                            <AddHeaderItemPopUp popUpKey="createNewsPop">
                                <AddNews />
                            </AddHeaderItemPopUp>
                        )
                    }
                </div>
            }
        >
            <main className={styles.wrapper}>
                <CurrentNews />
            </main>
        </PageWrapper>
    )
}

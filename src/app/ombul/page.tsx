import styles from './page.module.scss'
import CreateOmbul from './CreateOmbul'
import OmbulCover from './OmbulCover'
import PageWrapper from '@/components/PageWrapper/PageWrapper'
import { AddHeaderItemPopUp } from '@/components/HeaderItems/HeaderItemPopUp'
import { ServerSession } from '@/auth/session/ServerSession'
import { readLatestOmbulAction, readOmbulsAction } from '@/services/ombul/actions'
import { ombulAuth } from '@/services/ombul/auth'
import type { ExpandedOmbul } from '@/services/ombul/types'

export default async function Ombuls() {
    const showCreateButton = ombulAuth.create.auth(await ServerSession.fromNextAuth()).authorized

    const latestOmbulRes = await readLatestOmbulAction()
    const latestOmbul = latestOmbulRes.success ? latestOmbulRes.data : null
    const ombulRes = await readOmbulsAction()
    if (!ombulRes.success) throw new Error('Kunne ikke laste ombuler')
    const ombuls = ombulRes.data

    const yearsWithOmbul = Object.entries(ombuls.reduce((groups, ombul) => {
        const year = ombul.year
        if (!groups[year]) {
            groups[year] = []
        }
        groups[year].push(ombul)
        return groups
    }, {} as { [year: number]: ExpandedOmbul[] })).toSorted(([a], [b]) => parseInt(b, 10) - parseInt(a, 10))


    return (
        <PageWrapper
            title="Ombul"
            headerItem={
                showCreateButton && (
                    <AddHeaderItemPopUp popUpKey="create ombul">
                        <CreateOmbul latestOmbul={latestOmbul} />
                    </AddHeaderItemPopUp>
                )
            }
        >
            <div className={styles.wrapper}>
                {
                    yearsWithOmbul.map(([year, ombulsInYear]) => (
                        <div key={year}>
                            <h1>{year}</h1>
                            <div className={styles.ombulList}>
                                {
                                    ombulsInYear.map(ombul => (
                                        <OmbulCover key={ombul.id} ombul={ombul} />
                                    ))
                                }
                            </div>
                        </div>
                    ))
                }
            </div>
        </PageWrapper>
    )
}

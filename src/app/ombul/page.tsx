import styles from './page.module.scss'
import CreateOmbul from './CreateOmbul'
import OmbulCover from './OmbulCover'
import PageWrapper from '@/components/PageWrapper/PageWrapper'
import { AddHeaderItemPopUp } from '@/components/HeaderItems/HeaderItemPopUp'
import { ombulOperations } from '@/services/ombul/operations'
import { ombulAuth } from '@/services/ombul/auth'
import { serverPage, withFallback } from '@/app/serverPage'
import type { ExpandedOmbul } from '@/services/ombul/types'

const { page, generateMetadata } = serverPage({
    operation: async () => {
        const [latestOmbul, ombuls] = await Promise.all([
            withFallback(ombulOperations.readLatest({}), null),
            ombulOperations.readAll({}),
        ])
        return { latestOmbul, ombuls }
    },
    authCheckers: {
        canCreate: () => ombulAuth.create.dynamicFields({}),
    },
    metadata: () => ({ title: 'Ombul' }),
    render: ({ data, authChecks }) => {
        const yearsWithOmbul = Object.entries(data.ombuls.reduce((groups, ombul) => {
            const year = ombul.year
            if (!groups[year]) {
                groups[year] = []
            }
            groups[year].push(ombul)
            return groups
        }, {} as { [year: number]: ExpandedOmbul[] })).toSorted(
            ([yearOne], [yearTwo]) => parseInt(yearTwo, 10) - parseInt(yearOne, 10)
        )

        return (
            <PageWrapper
                headerItem={
                    authChecks.canCreate.authorized && (
                        <AddHeaderItemPopUp popUpKey="create ombul">
                            <CreateOmbul latestOmbul={data.latestOmbul} />
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
    },
})

export default page
export { generateMetadata }

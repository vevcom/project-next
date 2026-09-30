import UpdateStudyProgrammeForm from './updateStudyProgrammeForm'
import StudyProgrammeTableBody from './studyProgrammeTable'
import styles from './page.module.scss'
import { studyProgrammeOperations } from '@/services/groups/studyProgrammes/operations'
import { AddHeaderItemPopUp } from '@/components/HeaderItems/HeaderItemPopUp'
import PageWrapper from '@/components/PageWrapper/PageWrapper'
import { studyProgrammeAuth } from '@/services/groups/studyProgrammes/auth'
import { serverPage } from '@/app/serverPage'

const { page, generateMetadata } = serverPage({
    operation: async () => studyProgrammeOperations.readMany({}),
    authCheckers: {
        canCreate: () => studyProgrammeAuth.create.dynamicFields({}),
        canEdit: () => studyProgrammeAuth.update.dynamicFields({}),
    },
    metadata: () => ({ title: 'Studieprogrammer' }),
    render: ({ data: studyprogrammes, authChecks }) => (
        <PageWrapper
            headerItem={
                authChecks.canCreate.authorized && (
                    <AddHeaderItemPopUp popUpKey="create ombul">
                        <UpdateStudyProgrammeForm />
                    </AddHeaderItemPopUp>
                )
            }
        >
            <table className={styles.table}>
                <thead>
                    <tr>
                        {authChecks.canEdit.authorized && <th>Rediger</th>}
                        <th>Navn</th>
                        <th>Kode</th>
                        <th>Institutt kode</th>
                        <th>Startklasse</th>
                        <th>Lengde på studiet</th>
                        <th>Del av Omega</th>
                    </tr>
                </thead>
                <StudyProgrammeTableBody
                    studyprogrammes={studyprogrammes}
                    canEdit={authChecks.canEdit.authorized}
                />
            </table>
        </PageWrapper>
    ),
})

export default page
export { generateMetadata }

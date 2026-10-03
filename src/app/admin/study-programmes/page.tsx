'use server'

import UpdateStudyProgrammeForm from './updateStudyProgrammeForm'
import StudyProgrammeTableBody from './studyProgrammeTable'
import styles from './page.module.scss'
import { readStudyProgrammesAction } from '@/services/groups/studyProgrammes/actions'
import { AddHeaderItemPopUp } from '@/components/HeaderItems/HeaderItemPopUp'
import PageWrapper from '@/components/PageWrapper/PageWrapper'
import { unwrapActionReturn } from '@/app/redirectToErrorPage'
import { studyProgrammeAuth } from '@/services/groups/studyProgrammes/auth'
import { authorizeAdminPage } from '@/app/admin/authorizeAdminPage'


export default async function StudyProgrammes() {
    const studyprogrammes = unwrapActionReturn(await readStudyProgrammesAction())

    const session = await authorizeAdminPage('study-programmes')
    const showCreateButton = studyProgrammeAuth.create.auth(session).authorized
    const canEdit = studyProgrammeAuth.update.auth(session).authorized


    return <PageWrapper
        title="Studieprogrammer"
        headerItem={
            showCreateButton && (
                <AddHeaderItemPopUp popUpKey="create ombul">
                    <UpdateStudyProgrammeForm />
                </AddHeaderItemPopUp>
            )
        }
    >
        <table className={styles.table}>
            <thead>
                <tr>
                    {canEdit && <th>Rediger</th>}
                    <th>Navn</th>
                    <th>Kode</th>
                    <th>Institutt kode</th>
                    <th>Startklasse</th>
                    <th>Lengde på studiet</th>
                    <th>Del av Omega</th>
                </tr>
            </thead>
            <StudyProgrammeTableBody studyprogrammes={studyprogrammes} canEdit={canEdit} />
        </table>
    </PageWrapper>
}

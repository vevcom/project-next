'use client'

import styles from './studyProgrammeTable.module.scss'
import UpdateStudyProgrammeForm from './updateStudyProgrammeForm'
import PopUp from '@/components/PopUp/PopUp'
import Link from 'next/link'
import { ClassLevelConfig } from '@/services/groups/constants'
import { faPencil } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { v4 as uuid } from 'uuid'
import type { StudyProgramme } from '@/prisma-generated-pn-types'


export default function StudyProgrammeTableBody({
    studyprogrammes,
    canEdit
}: {
    studyprogrammes: StudyProgramme[],
    canEdit: boolean,
}) {
    return <tbody>
        {studyprogrammes.map(studyProgramme =>
            <tr key={uuid()}>
                {canEdit && <td className={styles.editButtonWrapper}><PopUp
                    showButtonContent={<FontAwesomeIcon icon={faPencil} />}
                    showButtonClass={styles.editButton}
                    popUpKey={uuid()}
                >
                    <UpdateStudyProgrammeForm studyProgramme={studyProgramme} />
                </PopUp></td>}
                <th>
                    <Link href={`/admin/study-programmes/${studyProgramme.id}`}>
                        {studyProgramme.name}
                    </Link>
                </th>
                <td>{studyProgramme.code}</td>
                <td>{studyProgramme.insititueCode ?? ''}</td>
                <td>{studyProgramme.classLevel ? ClassLevelConfig[studyProgramme.classLevel].name : ''}</td>
                <td>{studyProgramme.yearsLength ?? ''}</td>
                <td>{studyProgramme.partOfOmega ? 'Ja' : 'Nei'}</td>
            </tr>
        )}
    </tbody>
}

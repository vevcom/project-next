'use client'
import styles from './ManageUserStudyProgrammes.module.scss'
import Form from '@/components/Form/Form'
import { SelectNumber } from '@/components/UI/Select'
import {
    addStudyProgrammeMembersAction,
    removeStudyProgrammeMembersAction,
} from '@/services/groups/studyProgrammes/actions'
import { configureAction } from '@/services/configureAction'
import { useState } from 'react'

export type StudyProgrammeOption = {
    id: number,
    groupId: number,
    name: string,
    code: string,
}

type PropTypes = {
    userId: number,
    /** Every study programme there is - what the user may be put into. */
    studyProgrammes: StudyProgrammeOption[],
    /** The programmes the user is on now, as group ids. */
    memberOfGroupIds: number[],
}

/**
 * Puts a user on a study programme or takes them off it by hand.
 *
 * Membership normally follows what Feide reports, but Feide is not the whole truth - a user may be
 * on a programme it does not know about. Removing one sticks: Feide only ever adds a programme the
 * first time it reports it, so it will not undo this at the next login.
 */
export default function ManageUserStudyProgrammes({
    userId,
    studyProgrammes,
    memberOfGroupIds,
}: PropTypes) {
    const memberOf = studyProgrammes.filter(programme => memberOfGroupIds.includes(programme.groupId))
    const available = studyProgrammes.filter(programme => !memberOfGroupIds.includes(programme.groupId))
    const [groupIdToAdd, setGroupIdToAdd] = useState(available[0]?.groupId)

    return (
        <div className={styles.ManageUserStudyProgrammes}>
            <h2>Studieprogram</h2>

            {memberOf.length === 0 ? (
                <p className={styles.empty}>Brukeren står ikke på noe studieprogram.</p>
            ) : (
                <div className={styles.programmes}>
                    {memberOf.map(programme => (
                        <div className={styles.programme} key={programme.id}>
                            <span>{programme.name} ({programme.code})</span>
                            <Form
                                className={styles.removeForm}
                                submitText="Fjern"
                                submitColor="red"
                                action={() => configureAction(
                                    removeStudyProgrammeMembersAction, { params: { groupId: programme.groupId } }
                                )({ data: { userIds: [userId] } })}
                                refreshOnSuccess
                                confirmation={{
                                    confirm: true,
                                    text: `Fjerne brukeren fra ${programme.name}? `
                                        + 'Medlemskapet blir satt inaktivt, og Feide legger det ikke til igjen.',
                                }}
                            />
                        </div>
                    ))}
                </div>
            )}

            {available.length > 0 && groupIdToAdd !== undefined && (
                <Form
                    className={styles.addForm}
                    submitText="Legg til"
                    action={() => configureAction(
                        addStudyProgrammeMembersAction, { params: { groupId: groupIdToAdd } }
                    )({ data: { users: [{ userId, admin: false }] } })}
                    refreshOnSuccess
                >
                    <SelectNumber
                        name="studyProgramme"
                        label="Legg til studieprogram"
                        value={groupIdToAdd}
                        onChange={setGroupIdToAdd}
                        options={available.map(programme => ({
                            value: programme.groupId,
                            label: `${programme.name} (${programme.code})`,
                            key: `${programme.id}`,
                        }))}
                    />
                </Form>
            )}
        </div>
    )
}

import styles from './page.module.scss'
import {
    addStudyProgrammeMembersAction,
    readStudyProgrammeAction,
    readStudyProgrammeMembersAction,
    readStudyProgrammesExpandedAction,
    removeStudyProgrammeMembersAction,
} from '@/services/groups/studyProgrammes/actions'
import { studyProgrammeAuth } from '@/services/groups/studyProgrammes/auth'
import { unwrapActionReturn } from '@/app/redirectToErrorPage'
import { ServerSession } from '@/auth/session/ServerSession'
import PageWrapper from '@/components/PageWrapper/PageWrapper'
import ManageGroupMembers from '@/components/Group/ManageGroupMembers'
import { groupMembersByOrder } from '@/components/Group/groupMembersByOrder'
import { ClassLevelConfig } from '@/services/groups/constants'
import { notFound } from 'next/navigation'

type PropTypes = {
    params: Promise<{
        id: string
    }>
}

/**
 * Administers one study programme's members.
 *
 * Membership normally follows what Feide reports about a user, so this is the exception rather than
 * the rule - someone on a programme Feide does not know about, or someone who should not be on one.
 * A member removed here stays removed: Feide only acts on a programme the first time it reports it.
 */
export default async function StudyProgrammeAdmin({ params }: PropTypes) {
    const id = Number((await params).id)
    if (!Number.isInteger(id)) notFound()

    const session = await ServerSession.fromNextAuth()
    studyProgrammeAuth.read.dynamicFields({}).auth(session)
        .redirectOnUnauthorized({ returnUrl: `/admin/study-programmes/${id}` })

    const studyProgramme = unwrapActionReturn(await readStudyProgrammeAction({ params: { id } }))

    const [expandedGroups, members] = await Promise.all([
        readStudyProgrammesExpandedAction().then(unwrapActionReturn),
        readStudyProgrammeMembersAction({ params: { groupId: studyProgramme.groupId } })
            .then(unwrapActionReturn),
    ])

    const expanded = expandedGroups.find(group => group.id === studyProgramme.groupId)
    if (!expanded) notFound()

    const canAddMembers = studyProgrammeAuth.addMembers.dynamicFields({
        groupId: studyProgramme.groupId,
    }).auth(session).authorized
    const canRemoveMembers = studyProgrammeAuth.removeMembers.dynamicFields({
        groupId: studyProgramme.groupId,
    }).auth(session).authorized

    return (
        <PageWrapper title={studyProgramme.name}>
            <div className={styles.wrapper}>
                <div className={styles.facts}>
                    <span>Kode: {studyProgramme.code}</span>
                    <span>Orden: {expanded.order}</span>
                    <span>Aktive medlemmer: {expanded.members}</span>
                    <span>
                        Startklasse: {studyProgramme.classLevel
                            ? ClassLevelConfig[studyProgramme.classLevel].name
                            : 'Ikke satt'}
                    </span>
                </div>

                <p className={styles.explanation}>
                    Medlemskap følger normalt det Feide melder om brukeren. Legger du til eller fjerner
                    noen her, blir det stående: Feide legger bare til et studieprogram første gang det
                    blir meldt for brukeren.
                </p>

                {(canAddMembers || canRemoveMembers) && (
                    <ManageGroupMembers
                        groupId={studyProgramme.groupId}
                        groupOrder={expanded.order}
                        orders={groupMembersByOrder(members, expanded.order)}
                        addMembersAction={canAddMembers ? addStudyProgrammeMembersAction : undefined}
                        removeMembersAction={canRemoveMembers ? removeStudyProgrammeMembersAction : undefined}
                    />
                )}
            </div>
        </PageWrapper>
    )
}

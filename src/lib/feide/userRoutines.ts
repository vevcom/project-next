import '@pn-server-only'
import { fetchStudyProgrammesFromFeide } from './api'
import { studyProgrammeOperations } from '@/services/groups/studyProgrammes/operations'

/**
 * Brings a user's study programme memberships in line with what Feide reports about them.
 *
 * Every programme Feide reports is upserted, and the user is then added to each of them through the
 * study programme service. That service places the membership at the study programme group's own
 * order - study programmes follow omega's order, so always the current one - and reactivates an
 * existing membership of that order instead of duplicating it.
 *
 * The operation is therefore idempotent, and it also brings a user who was left behind in an earlier
 * order up to the current one.
 *
 * Note that a programme the user has *left* is not deactivated here: this only ever adds. Dropping
 * stale programme memberships would need Feide to be treated as the whole truth about a user, which
 * it is not - a membership may also have been granted by hand.
 */
export async function updateUserStudyProgrammes(userId: number, accessToken: string) {
    const feideStudyProgrammes = await fetchStudyProgrammesFromFeide(accessToken)

    const studyProgrammes = await studyProgrammeOperations.upsertMany({
        data: { studyProgrammes: feideStudyProgrammes },
        bypassAuth: true,
    })

    await Promise.all(studyProgrammes.map(studyProgramme =>
        studyProgrammeOperations.addMembers({
            params: { groupId: studyProgramme.groupId },
            data: { users: [{ userId, admin: false }] },
            bypassAuth: true,
        })
    ))
}

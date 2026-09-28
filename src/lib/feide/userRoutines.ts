import '@pn-server-only'
import { fetchStudyProgrammesFromFeide } from './api'
import { studyProgrammeOperations } from '@/services/groups/studyProgrammes/operations'
import { classOperations } from '@/services/groups/classes/operations'
import { CLASS_LEVEL_ORDERING } from '@/services/groups/constants'
import type { StudyProgramme } from '@/prisma-generated-pn-types'

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
 *
 * @returns the user's study programmes as they are stored, so the caller can reason about them.
 */
export async function updateUserStudyProgrammes(
    userId: number,
    accessToken: string,
): Promise<StudyProgramme[]> {
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

    return studyProgrammes
}

/**
 * Places a user who has never been put in a class into the one their study programmes imply.
 *
 * A programme says which class a student of it starts in - a five year master starts in ONE, a two
 * year master in FOUR - so the highest of the user's programmes is the one that decides: someone
 * registered on both a bachelor and a master is in the master's class.
 *
 * It only ever fills a blank. A user who already has a class is left alone: their class is then
 * either current or the class bump's business, and neither is something a login should overrule.
 *
 * Nothing happens when no programme says anything - a programme Feide told us about for the first
 * time has no class level until someone sets one.
 */
export async function inferClassFromStudyProgrammes(
    userId: number,
    studyProgrammes: StudyProgramme[],
): Promise<void> {
    const currentClass = await classOperations.readClassOfUser({
        params: { userId },
        bypassAuth: true,
    })
    if (currentClass) return

    const levels = studyProgrammes
        .map(studyProgramme => studyProgramme.classLevel)
        .filter(level => level !== null)
    if (levels.length === 0) return

    const highestLevel = levels.reduce((highest, level) => (
        CLASS_LEVEL_ORDERING.indexOf(level) > CLASS_LEVEL_ORDERING.indexOf(highest) ? level : highest
    ))

    await classOperations.changeClassOfUser({
        params: { userId },
        data: { level: highestLevel },
        bypassAuth: true,
    })
}

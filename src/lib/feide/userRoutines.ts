import '@pn-server-only'
import { fetchStudyProgrammesFromFeide } from './api'
import { studyProgrammeOperations } from '@/services/groups/studyProgrammes/operations'
import { classOperations } from '@/services/groups/classes/operations'
import { CLASS_LEVEL_ORDERING } from '@/services/groups/constants'
import type { StudyProgramme } from '@/prisma-generated-pn-types'

/**
 * Brings a user's study programme memberships in line with what Feide reports about them.
 *
 * Every programme Feide reports is upserted, and the user is added to the ones Feide has not
 * reported for them before. That last part is what makes manual membership possible: Feide keeps
 * reporting a programme whether anyone acts on it or not, so adding on every login would put a
 * membership an administrator removed straight back. Which programmes have been acted on is
 * remembered per user, and only the ones seen for the first time are added.
 *
 * A programme the user has *left* is still not deactivated here: this only ever adds. Feide is not
 * treated as the whole truth about a user, since a membership may also have been granted by hand.
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

    const alreadyReturned = await studyProgrammeOperations.readFeideReturnedForUser({
        params: { userId },
        bypassAuth: true,
    })
    const alreadyReturnedIds = new Set(alreadyReturned.map(studyProgramme => studyProgramme.id))
    const reportedForTheFirstTime = studyProgrammes.filter(
        studyProgramme => !alreadyReturnedIds.has(studyProgramme.id)
    )

    if (reportedForTheFirstTime.length === 0) return studyProgrammes

    await Promise.all(reportedForTheFirstTime.map(studyProgramme =>
        studyProgrammeOperations.addMembers({
            params: { groupId: studyProgramme.groupId },
            data: { users: [{ userId, admin: false }] },
            bypassAuth: true,
        })
    ))

    await studyProgrammeOperations.recordFeideReturnedForUser({
        params: { userId },
        data: { studyProgrammeIds: reportedForTheFirstTime.map(studyProgramme => studyProgramme.id) },
        bypassAuth: true,
    })

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

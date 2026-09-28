'use server'

import { makeAction } from '@/services/serverAction'
import { studyProgrammeOperations } from '@/services/groups/studyProgrammes/operations'

export const createStudyProgrammeAction = makeAction(studyProgrammeOperations.create)
export const readStudyProgrammeAction = makeAction(studyProgrammeOperations.read)
export const readStudyProgrammesAction = makeAction(studyProgrammeOperations.readMany)
export const updateStudyProgrammeAction = makeAction(studyProgrammeOperations.update)
export const destroyStudyProgrammeAction = makeAction(studyProgrammeOperations.destroy)
export const readStudyProgrammesExpandedAction = makeAction(studyProgrammeOperations.readExpanded)
export const readStudyProgrammeMembersAction = makeAction(studyProgrammeOperations.readMembers)
export const migrateStudyProgrammesAction = makeAction(studyProgrammeOperations.migrateGroups)

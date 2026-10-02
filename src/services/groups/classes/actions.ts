'use server'

import { makeAction } from '@/services/serverAction'
import { classOperations } from '@/services/groups/classes/operations'

export const readClassAction = makeAction(classOperations.read)
export const readClassesAction = makeAction(classOperations.readMany)
export const readClassesExpandedAction = makeAction(classOperations.readExpanded)
export const readClassMembersAction = makeAction(classOperations.readMembers)
export const readClassMembershipsOfUserAction = makeAction(classOperations.readMembershipsOfUser)
export const changeClassOfUserAction = makeAction(classOperations.changeClassOfUser)
export const bumpClassesAction = makeAction(classOperations.bumpClasses)
export const migrateClassesAction = makeAction(classOperations.migrateGroups)

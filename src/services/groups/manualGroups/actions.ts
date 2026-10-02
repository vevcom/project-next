'use server'

import { makeAction } from '@/services/serverAction'
import { manualGroupOperations } from '@/services/groups/manualGroups/operations'

export const createManualGroupAction = makeAction(manualGroupOperations.create)
export const readManualGroupAction = makeAction(manualGroupOperations.read)
export const readManualGroupsAction = makeAction(manualGroupOperations.readMany)
export const updateManualGroupAction = makeAction(manualGroupOperations.update)
export const destroyManualGroupAction = makeAction(manualGroupOperations.destroy)
export const readManualGroupsExpandedAction = makeAction(manualGroupOperations.readExpanded)
export const readManualGroupMembersAction = makeAction(manualGroupOperations.readMembers)
export const readManualGroupMembershipsOfUserAction = makeAction(manualGroupOperations.readMembershipsOfUser)
export const addManualGroupMembersAction = makeAction(manualGroupOperations.addMembers)
export const removeManualGroupMembersAction = makeAction(manualGroupOperations.removeMembers)
export const setManualGroupMemberAdminAction = makeAction(manualGroupOperations.setMemberAdmin)
export const setManualGroupMemberTitleAction = makeAction(manualGroupOperations.setMemberTitle)
export const migrateManualGroupAction = makeAction(manualGroupOperations.migrateGroup)
export const pensionManualGroupAction = makeAction(manualGroupOperations.pension)

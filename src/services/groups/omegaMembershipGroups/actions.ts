'use server'

import { makeAction } from '@/services/serverAction'
import { omegaMembershipGroupOperations } from '@/services/groups/omegaMembershipGroups/operations'

export const readOmegaMembershipGroupAction = makeAction(omegaMembershipGroupOperations.read)
export const readOmegaMembershipGroupsAction = makeAction(omegaMembershipGroupOperations.readMany)
export const readOmegaMembershipGroupsExpandedAction = makeAction(omegaMembershipGroupOperations.readExpanded)
export const readOmegaMembershipGroupMembersAction = makeAction(omegaMembershipGroupOperations.readMembers)
export const migrateOmegaMembershipGroupsAction = makeAction(omegaMembershipGroupOperations.migrateGroups)

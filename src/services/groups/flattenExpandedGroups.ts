import type { ExpandedGroup, ExpandedGroupsOfAllTypes } from './types'

/**
 * Flattens the per-group-type expanded groups into a single list, dropping the group types the
 * session may not read. Use it where a caller genuinely wants every group it can see at once - a
 * caller that works per group type should index the record instead.
 */
export function flattenExpandedGroups(groupsOfAllTypes: ExpandedGroupsOfAllTypes): ExpandedGroup[] {
    return Object.values(groupsOfAllTypes).flatMap(groups => groups ?? [])
}

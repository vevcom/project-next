'use server'

import { makeAction } from '@/services/serverAction'
import { readExpandedOfAllTypes } from '@/services/groups/readExpandedOfAllTypes'

export const readExpandedGroupsOfAllTypesAction = makeAction(readExpandedOfAllTypes)

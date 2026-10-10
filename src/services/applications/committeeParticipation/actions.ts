'use server'

import { committeeParticipationOperations } from './operations'
import { makeAction } from '@/services/serverAction'

export const readCommitteeParticipatingPeriodAction = makeAction(committeeParticipationOperations.readAll)

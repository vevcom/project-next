'use server'
import { releaseCountdownOperations } from './operations'
import { makeAction } from '@/services/serverAction'

export const readReleaseCountdownIsActiveAction = makeAction(releaseCountdownOperations.readIsActive)
export const unlockReleaseCountdownAction = makeAction(releaseCountdownOperations.unlock)

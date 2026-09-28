'use server'
import { omegaOrderOperations } from './operations'
import { makeAction } from '@/services/serverAction'

export const createOmegaOrderAction = makeAction(omegaOrderOperations.create)
export const readCurrentOmegaOrderAction = makeAction(omegaOrderOperations.readCurrent)
export const readOmegaOrderRequirementsAction = makeAction(omegaOrderOperations.readRequirements)
export const readAllOmegaOrdersAction = makeAction(omegaOrderOperations.readAll)

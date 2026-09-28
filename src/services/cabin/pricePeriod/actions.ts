'use server'
import { cabinPricePeriodOperations } from './operations'
import { makeAction } from '@/services/serverAction'

export const createPricePeriodAction = makeAction(cabinPricePeriodOperations.create)
export const destoryPricePeriodAction = makeAction(cabinPricePeriodOperations.destroy)
export const readPricePeriodsAction = makeAction(cabinPricePeriodOperations.readMany)
export const readPublicPricePeriodsAction = makeAction(cabinPricePeriodOperations.readPublicPeriods)
export const readUnreleasedPricePeriodsAction = makeAction(cabinPricePeriodOperations.readUnreleasedPeriods)

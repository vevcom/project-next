'use server'
import { cabinProductOperations } from './operations'
import { makeAction } from '@/services/serverAction'

export const readCabinProductsAction = makeAction(cabinProductOperations.readMany)
export const readCabinProductsActiveAction = makeAction(cabinProductOperations.readActive)
export const readCabinProductAction = makeAction(cabinProductOperations.read)
export const createCabinProductAction = makeAction(cabinProductOperations.create)
export const createCabinProductPriceAction = makeAction(cabinProductOperations.createPrice)

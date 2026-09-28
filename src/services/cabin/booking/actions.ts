'use server'
import { cabinBookingOperations } from './operations'
import { makeAction } from '@/services/serverAction'

export const createCabinBookingUserAttachedAction = makeAction(cabinBookingOperations.createCabinBookingUserAttached)
export const createBedBookingUserAttachedAction = makeAction(cabinBookingOperations.createBedBookingUserAttached)
export const createCabinBookingNoUserAction = makeAction(cabinBookingOperations.createCabinBookingNoUser)
export const createBedBookingNoUserAction = makeAction(cabinBookingOperations.createBedBookingNoUser)
export const readCabinAvailabilityAction = makeAction(cabinBookingOperations.readAvailability)
export const readCabinBookingsAction = makeAction(cabinBookingOperations.readMany)
export const readCabinBookingAction = makeAction(cabinBookingOperations.read)

export const readSpecialCmsParagraphCabinContractAction = makeAction(
    cabinBookingOperations.readSpecialCmsParagraphCabinContract
)
export const updateSpecialCmsParagraphCabinContractAction = makeAction(
    cabinBookingOperations.updateSpecialCmsParagraphContentCabinContract
)

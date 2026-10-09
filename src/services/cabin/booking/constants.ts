import { createSelection } from '@/services/createSelection'
import { userBasicSelection } from '@/services/users/constants'
import type { Booking } from '@/prisma-generated-pn-types'

export const cabinBookingFieldsToExpose = ['start', 'end', 'type'] as const satisfies (keyof Booking)[]

export const cabinBookingFilterSelection = createSelection(cabinBookingFieldsToExpose)

export const cabinBookingIncluder = {
    user: {
        select: userBasicSelection,
    },
    BookingProduct: {
        include: {
            product: true,
        }
    },
    event: true,
    guestUser: true,
}

// How long a reserved booking blocks the calendar before payment must be started.
export const cabinReservationWindowMs = 10 * 60 * 1000

// The advisory lock every reservation takes for its transaction, so two of them cannot both find
// the same dates free. Unique across the app: companySponsorTierLockKey is 581_000_001.
export const cabinBookingLockKey = 581_000_002

// The longest stay one booking may cover.
export const maxCabinBookingNights = 14

// How many reservations one booker may hold unpaid at a time, so dates cannot be kept blocked by
// reserving over and over without paying.
export const maxUnpaidReservationsPerBooker = 2

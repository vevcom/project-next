import { RequirePermission } from '@/auth/authorizer/RequirePermission'
import { RequirePermissionAndUserId } from '@/auth/authorizer/RequirePermissionAndUserId'

export const cabinBookingAuth = {
    createCabinBookingUserAttached: RequirePermissionAndUserId.staticFields({
        permission: 'CABIN_BOOKING_CABIN_CREATE'
    }),

    createCabinBookingNoUser: RequirePermission.staticFields({
        permission: 'CABIN_BOOKING_CABIN_CREATE'
    }),

    createBedBookingUserAttached: RequirePermissionAndUserId.staticFields({
        permission: 'CABIN_BOOKING_BED_CREATE'
    }),

    createBedBookingNoUser: RequirePermission.staticFields({
        permission: 'CABIN_BOOKING_BED_CREATE'
    }),

    readAvailability: RequirePermission.staticFields({
        permission: 'CABIN_CALENDAR_READ'
    }),

    readMany: RequirePermission.staticFields({
        permission: 'CABIN_BOOKING_ADMIN'
    }),

    read: RequirePermission.staticFields({
        permission: 'CABIN_BOOKING_ADMIN'
    }),

    readSpecialCmsParagraphCabinContract: RequirePermission.staticFields({
        permission: 'CABIN_CALENDAR_READ'
    }),

    updateSpecialCmsParagraphContentCabinContract: RequirePermission.staticFields({
        permission: 'CABIN_BOOKING_ADMIN'
    })
} as const


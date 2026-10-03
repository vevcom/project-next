import { requireBookingAccess } from '@/auth/authorizer/RequireBookingAccess'
import { Require } from '@/auth/authorizer/Require'

export const cabinBookingAuth = {
    createCabinBookingUserAttached: Require.userId().permission('CABIN_USE'),

    createCabinBookingNoUser: Require.permission('CABIN_USE'),

    createBedBookingUserAttached: Require.userId().permission('CABIN_USE'),

    createBedBookingNoUser: Require.permission('CABIN_USE'),

    readAvailability: Require.permission('CABIN_USE'),

    readMany: Require.permission('CABIN_ADMIN'),

    read: Require.permission('CABIN_ADMIN'),

    readSpecialCmsParagraphCabinContract: Require.permission('CABIN_USE'),

    updateSpecialCmsParagraphContentCabinContract: Require.permission('CABIN_ADMIN'),

    // Domain access only: may this session pay for *this* booking - owns it (session, or the
    // matching secret for a guest booking with no session to check ownership against) or holds
    // CABIN_ADMIN. Provider/account-ownership rules are not this operation's business -
    // paymentOperations.create and ledgerTransactionOperations.create already own those.
    createPayment: (
        booking: { userId: number | null, secret: string },
        providedSecret: string,
    ) => requireBookingAccess('CABIN_ADMIN', booking, providedSecret),
} as const


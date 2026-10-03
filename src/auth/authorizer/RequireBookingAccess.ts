import { Require } from './Require'
import { createHash, timingSafeEqual } from 'crypto'
import type { Permission } from '@/prisma-generated-pn-types'

/**
 * Constant-time string comparison, via fixed-length digests so timingSafeEqual (which throws on
 * a length mismatch) never sees differing lengths and no length is leaked either.
 */
function secretsMatch(a: string, b: string): boolean {
    const digestA = createHash('sha256').update(a).digest()
    const digestB = createHash('sha256').update(b).digest()
    return timingSafeEqual(digestA, digestB)
}

/**
 * Authorized if the session holds `permission`, the session user owns the booking, or the
 * caller supplied the booking's secret. The secret is how a guest booking (created without a
 * session) can be resumed and paid for later without logging in.
 */
export function requireBookingAccess(
    permission: Permission,
    booking: { userId: number | null, secret: string },
    providedSecret?: string,
) {
    return Require.permission(permission).or().custom(({ session }) => (
        (session.user !== null && session.user.id === booking.userId) ||
        (providedSecret !== undefined && secretsMatch(providedSecret, booking.secret))
    ), { errorMessage: 'Du har ikke tilgang til denne bookingen.' })
}

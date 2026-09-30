import '@pn-server-only'
import { releaseCountdownAuth } from './auth'
import { releaseCountdownSchemas } from './schemas'
import { RELEASE_COUNTDOWN_COOKIE_NAME, RELEASE_COUNTDOWN_PASSWORD, RELEASE_DATE } from './constants'
import { defineOperation } from '@/services/serviceOperation'
import { ServerError } from '@/services/error'
import { cookies } from 'next/headers'
import { createHash, timingSafeEqual } from 'crypto'

/**
 * The cookie stores a hash of the password rather than a plain flag, so it cannot be forged
 * without knowing the password, and changing the password invalidates all existing cookies.
 */
function unlockToken(password: string) {
    return createHash('sha256').update(`${RELEASE_COUNTDOWN_COOKIE_NAME}:${password}`).digest('hex')
}

function safeEquals(first: string, second: string) {
    const firstBuffer = Buffer.from(first)
    const secondBuffer = Buffer.from(second)
    return firstBuffer.length === secondBuffer.length && timingSafeEqual(firstBuffer, secondBuffer)
}

export const releaseCountdownOperations = {
    /**
     * Whether the countdown should be shown instead of the website.
     */
    readIsActive: defineOperation({
        authorizer: () => releaseCountdownAuth.readIsActive.dynamicFields({}),
        operation: async () => {
            if (Date.now() >= RELEASE_DATE.getTime()) return false
            if (!RELEASE_COUNTDOWN_PASSWORD) return true

            const cookie = (await cookies()).get(RELEASE_COUNTDOWN_COOKIE_NAME)
            return !cookie || !safeEquals(cookie.value, unlockToken(RELEASE_COUNTDOWN_PASSWORD))
        }
    }),
    unlock: defineOperation({
        authorizer: () => releaseCountdownAuth.unlock.dynamicFields({}),
        dataSchema: releaseCountdownSchemas.unlock,
        operation: async ({ data }) => {
            if (!RELEASE_COUNTDOWN_PASSWORD) {
                throw new ServerError('BAD DATA', 'Det er ikke satt noe passord for å komme forbi nedtellingen')
            }
            if (!safeEquals(data.password, RELEASE_COUNTDOWN_PASSWORD)) {
                throw new ServerError('BAD DATA', 'Feil passord')
            }

            const cookieStore = await cookies()
            cookieStore.set(RELEASE_COUNTDOWN_COOKIE_NAME, unlockToken(RELEASE_COUNTDOWN_PASSWORD), {
                httpOnly: true,
                sameSite: 'lax',
                secure: process.env.NODE_ENV === 'production',
                path: '/',
                expires: RELEASE_DATE,
            })
        }
    }),
} as const

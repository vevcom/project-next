/**
 * The moment the website is released. Until then, visitors are shown the release countdown
 * instead of the website (unless they have unlocked it with the password).
 */
export const RELEASE_DATE = new Date('2026-11-01T18:00:00+01:00')

export const RELEASE_COUNTDOWN_COOKIE_NAME = 'release-countdown-unlock'

export const RELEASE_COUNTDOWN_PASSWORD = process.env.RELEASE_COUNTDOWN_PASSWORD

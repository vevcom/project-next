'use client'
import styles from './ReleaseCountdown.module.scss'
import GitGraphPlayer from './GitGraphPlayer'
import Form from '@/components/Form/Form'
import TextInput from '@/components/UI/TextInput'
import useKeyPress from '@/hooks/useKeyPress'
import { unlockReleaseCountdownAction } from '@/services/releaseCountdown/actions'
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { useRouter } from 'next/navigation'

const releaseDateFormat = new Intl.DateTimeFormat('nb-NO', {
    dateStyle: 'full',
    timeStyle: 'short',
    timeZone: 'Europe/Oslo',
})

const SECOND = 1000
const MINUTE = 60 * SECOND
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

const subscribeToClock = (onTick: () => void) => {
    const interval = setInterval(onTick, SECOND / 4)
    return () => clearInterval(interval)
}
// Rounded to whole seconds so repeated reads within the same second return the same snapshot.
const readClock = () => Math.floor(Date.now() / SECOND) * SECOND
// The server renders placeholders, and the client fills in the time right after hydration.
const readServerClock = () => null

type PropTypes = {
    releaseDate: number,
}

/**
 * Shown instead of the website until it is released.
 * Pressing space opens a password prompt that lets you in early.
 */
export default function ReleaseCountdown({ releaseDate }: PropTypes) {
    const now = useSyncExternalStore(subscribeToClock, readClock, readServerClock)
    const [showUnlock, setShowUnlock] = useState(false)
    const hasRefreshed = useRef(false)
    const { refresh } = useRouter()

    const remaining = now === null ? null : Math.max(0, releaseDate - now)

    useEffect(() => {
        if (remaining !== 0 || hasRefreshed.current) return
        // The server stops showing the countdown once the release date has passed.
        hasRefreshed.current = true
        refresh()
    }, [remaining, refresh])

    useKeyPress(' ', useCallback((event: KeyboardEvent) => {
        if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return
        setShowUnlock(true)
    }, []))
    useKeyPress('Escape', useCallback(() => setShowUnlock(false), []))

    const units = [
        { label: 'dager', unitLength: DAY, cycle: Infinity },
        { label: 'timer', unitLength: HOUR, cycle: DAY },
        { label: 'minutter', unitLength: MINUTE, cycle: HOUR },
        { label: 'sekunder', unitLength: SECOND, cycle: MINUTE },
    ].map(({ label, unitLength, cycle }) => ({
        label,
        value: remaining === null ? '--' : String(Math.floor(remaining % cycle / unitLength)).padStart(2, '0'),
    }))

    return (
        <div className={styles.ReleaseCountdown}>
            <div className={styles.countdown}>
                <h1>Project Next</h1>
                <div className={styles.units}>
                    {units.map(unit => (
                        <div key={unit.label} className={styles.unit}>
                            <span className={styles.value}>{unit.value}</span>
                            <span className={styles.label}>{unit.label}</span>
                        </div>
                    ))}
                </div>
                <p className={styles.releaseDate}>{releaseDateFormat.format(new Date(releaseDate))}</p>
            </div>
            <GitGraphPlayer />
            {showUnlock && (
                <div className={styles.unlock}>
                    <Form action={unlockReleaseCountdownAction} submitText="Lås opp" refreshOnSuccess>
                        <TextInput type="password" name="password" label="Passord" autoFocus />
                    </Form>
                </div>
            )}
        </div>
    )
}

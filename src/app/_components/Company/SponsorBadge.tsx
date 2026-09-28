import styles from './SponsorBadge.module.scss'
import { companySponsorTierDetails } from '@/services/career/companies/constants'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCrown, faStar } from '@fortawesome/free-solid-svg-icons'
import type { CompanySponsorTier } from '@/prisma-generated-pn-types'

const sponsorTierIcon = {
    MAIN: faCrown,
    SPONSOR: faStar,
} as const

type PropTypes = {
    sponsorTier: CompanySponsorTier,
    /** Drops the label, for the slots that only have room for the mark itself. */
    iconOnly?: boolean,
    className?: string,
}

/**
 * The mark a sponsor company carries through the career listings. Companies on the ordinary tier
 * render nothing at all, so callers can hand this every company without branching first.
 */
export default function SponsorBadge({ sponsorTier, iconOnly = false, className }: PropTypes) {
    if (sponsorTier === 'NONE') return <></>

    const { label, description } = companySponsorTierDetails[sponsorTier]

    return (
        <span
            className={`${styles.SponsorBadge} ${styles[sponsorTier]} ${className ?? ''}`}
            title={`${label} — ${description}`}
        >
            <FontAwesomeIcon icon={sponsorTierIcon[sponsorTier]} />
            {!iconOnly && <span className={styles.label}>{label}</span>}
        </span>
    )
}

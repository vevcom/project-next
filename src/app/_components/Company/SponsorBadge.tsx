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
    iconOnly?: boolean,
    className?: string,
}

/**
 * The mark a sponsor company carries through the career listings. NONE renders nothing, so callers
 * can pass any company without branching. The label stays in the document even when `iconOnly`
 * hides it, so the badge keeps an accessible name.
 */
export default function SponsorBadge({ sponsorTier, iconOnly = false, className }: PropTypes) {
    if (sponsorTier === 'NONE') return <></>

    const { label, description } = companySponsorTierDetails[sponsorTier]

    return (
        <span
            className={`${styles.SponsorBadge} ${styles[sponsorTier]} ${className ?? ''}`}
            title={`${label} — ${description}`}
        >
            <FontAwesomeIcon icon={sponsorTierIcon[sponsorTier]} aria-hidden />
            <span className={iconOnly ? styles.labelHidden : styles.label}>{label}</span>
        </span>
    )
}

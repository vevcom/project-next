import styles from './SponsorLegend.module.scss'
import SponsorBadge from './SponsorBadge'
import { companySponsorTierDetails } from '@/services/career/companies/constants'

/**
 * Spells out what the badges on the company cards mean, so the ordering of the career listings is
 * readable off the management page itself rather than being folklore.
 */
export default function SponsorLegend() {
    return (
        <dl className={styles.SponsorLegend}>
            <div>
                <dt><SponsorBadge sponsorTier="MAIN" /></dt>
                <dd>{companySponsorTierDetails.MAIN.description}</dd>
            </div>
            <div>
                <dt><SponsorBadge sponsorTier="SPONSOR" /></dt>
                <dd>{companySponsorTierDetails.SPONSOR.description}</dd>
            </div>
        </dl>
    )
}

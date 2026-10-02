import styles from './page.module.scss'
import loggedInStyles from './LoggedIn.module.scss'
import LoggedInSection from './LoggedInSection'
import PromoBar from './PromoBar'
import EventCard from '@/app/_components/Event/EventCard'
import JobAd from '@/app/career/jobads/JobAd'
import NewsCard from '@/app/news/NewsCard'
import OmbulRow from '@/app/ombul/OmbulRow'
import OmegaquoteRow from '@/app/omegaquotes/OmegaquoteRow'
import StandardImageServer from '@/components/Image/StandardImageServer'
import { unwrapActionReturn } from '@/app/redirectToErrorPage'
import { readNewsCurrentAction } from '@/services/news/actions'
import { readActiveJobAdsAction } from '@/services/career/jobAds/actions'
import { readCurrentEventsAction } from '@/services/events/actions'
import { readOmbulsAction } from '@/services/ombul/actions'
import { readQuotesPageAction } from '@/services/omegaquotes/actions'
import { readActivePromoAction } from '@/services/promo/actions'
import { ombulAuth } from '@/services/ombul/auth'
import { omegaQuotesAuth } from '@/services/omegaquotes/auth'
import { ServerSession } from '@/auth/session/ServerSession'
import Footer from '@/components/Footer/Footer'
import PageTitleSetter from '@/contexts/PageTitleSetter'
import { faAngleDown } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import Link from 'next/link'

export default async function LoggedInLandingPage() {
    const MAX_NUMBER_OF_ELEMENTS = 3
    const news = unwrapActionReturn(await readNewsCurrentAction())
        .slice(0, MAX_NUMBER_OF_ELEMENTS)
    const jobAds = unwrapActionReturn(await readActiveJobAdsAction())
        .slice(0, MAX_NUMBER_OF_ELEMENTS)
    const events = unwrapActionReturn(await readCurrentEventsAction({ params: { tags: null } }))
        .slice(0, MAX_NUMBER_OF_ELEMENTS)
    const promo = unwrapActionReturn(await readActivePromoAction())

    const session = await ServerSession.fromNextAuth()

    // Ombul and omegaquotes are membership permissions rather than default ones, so a logged in
    // user without them gets the islands left out entirely instead of an error page.
    const canReadOmbul = ombulAuth.readAll.dynamicFields({}).auth(session).authorized
    const ombuls = canReadOmbul
        ? unwrapActionReturn(await readOmbulsAction()).slice(0, MAX_NUMBER_OF_ELEMENTS)
        : []

    const canReadOmegaquotes = omegaQuotesAuth.readPage.dynamicFields({}).auth(session).authorized
    const omegaquotes = canReadOmegaquotes
        ? unwrapActionReturn(await readQuotesPageAction({
            params: {
                paging: {
                    page: {
                        pageSize: MAX_NUMBER_OF_ELEMENTS,
                        page: 0,
                        cursor: null,
                    },
                    details: undefined,
                }
            }
        }))
        : []

    return (
        <div className={styles.wrapper}>
            <PageTitleSetter title={'Sct. Omega'} />
            <div className={`${styles.part} ${styles.frontImg}`}>
                <div
                    className={`${styles.frontInfo} ${promo ? styles.withPromoBar : ''}`}
                >
                    <div>
                        <StandardImageServer
                            standardImage="LOGO_WHITE"
                            width={300}
                            tint="white"
                        />
                        <Link className={styles.scrollDown} href="#firstSection">
                            <FontAwesomeIcon icon={faAngleDown} />
                        </Link>
                    </div>
                </div>
            </div>
            {promo && (
                <div className={loggedInStyles.promoBarPart}>
                    <PromoBar promo={promo} />
                </div>
            )}
            <div id="firstSection" className={`${styles.part} ${loggedInStyles.loggedInPart}`}>
                <div>
                    <div className={loggedInStyles.islands}>
                        <LoggedInSection title="Nyheter" link="/news" emptyMessage="Det er for tiden ingen nyheter">
                            {news.map((newsArticle, key) => (
                                <NewsCard key={key} news={newsArticle} />
                            ))}
                        </LoggedInSection>
                        <LoggedInSection
                            title="Hvad der hender"
                            link="/events"
                            layout="rows"
                            span="half"
                            emptyMessage="Det er for tiden ingen kommende hendelser"
                        >
                            {events.map((event, key) => (
                                <EventCard key={key} event={event} />
                            ))}
                        </LoggedInSection>
                        <LoggedInSection
                            title="Jobbannonser"
                            link="/career/jobads"
                            layout="rows"
                            span="half"
                            emptyMessage="Det er for tiden ingen jobbannonser"
                        >
                            {jobAds.map((jobAd, key) => (
                                <JobAd key={key} jobAd={jobAd} />
                            ))}
                        </LoggedInSection>
                        {canReadOmbul && (
                            <LoggedInSection
                                title="Ombul"
                                link="/ombul"
                                layout="rows"
                                span="half"
                                emptyMessage="Det er ingen ombuler å vise enda"
                            >
                                {ombuls.map(ombul => (
                                    <OmbulRow key={ombul.id} ombul={ombul} />
                                ))}
                            </LoggedInSection>
                        )}
                        {canReadOmegaquotes && (
                            <LoggedInSection
                                title="Omegaquotes"
                                link="/omegaquotes"
                                layout="rows"
                                span="half"
                                emptyMessage="Det er ingen quotes å vise enda"
                            >
                                {omegaquotes.map(quote => (
                                    <OmegaquoteRow key={quote.id} quote={quote} />
                                ))}
                            </LoggedInSection>
                        )}
                        {/* Images section doesnt really fit for the logged in landing page.
                        <LoggedInSection title="Bilder" link="/image-collections">
                            Her kan man kanskje vise noen bilder ellerno
                        </LoggedInSection>
                        */}
                    </div>
                </div>
            </div>
            <div className={styles.footer}>
                <Footer />
            </div>
        </div>
    )
}

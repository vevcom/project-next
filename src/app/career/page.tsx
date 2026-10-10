import styles from './page.module.scss'
import SpecialCmsParagraph from '@/components/Cms/CmsParagraph/SpecialCmsParagraph'
import PageWrapper from '@/components/PageWrapper/PageWrapper'
import StandardImageServer from '@/components/Image/StandardImageServer'
import CmsLink from '@/components/Cms/CmsLink/CmsLink'
import { QueryParams } from '@/lib/queryParams/queryParams'
import { eventTagOperations } from '@/services/events/tags/operations'
import {
    readSpecialCmsParagraphCareerInfo,
    updateSpecialCmsParagraphContentCareerInfo,
    updateCareerSpecialCmsLinkAction
} from '@/services/career/actions'
import { careerOperations } from '@/services/career/operations'
import { careerAuth } from '@/services/career/auth'
import { serverPage, withFallback } from '@/app/serverPage'
import Link from 'next/link'
import type { PageOperationArgs } from '@/app/serverPage'

const { page, generateMetadata } = serverPage({
    operation: async ({ session }: PageOperationArgs) => {
        const [contactorCmsLink, companyPresentationEventTag] = await Promise.all([
            withFallback(
                careerOperations.readSpecialCmsLink({ params: { special: 'CAREER_LINK_TO_CONTACTOR' } }),
                null
            ),
            withFallback(
                eventTagOperations.readSpecial({ params: { special: 'COMPANY_PRESENTATION' } }),
                null
            ),
        ])
        return { contactorCmsLink, companyPresentationEventTag, isLoggedIn: Boolean(session.user) }
    },
    capabilityChecks: {
        canEditSpecialCmsLink: () => careerAuth.updateSpecialCmsLink,
        canEditSpecialCmsParagraph: () => careerAuth.updateSpecialCmsParagraphContentCareerInfo,
    },
    metadata: (data) => ({ title: data.isLoggedIn ? 'Karriere' : 'For bedrifter' }),
    render: ({ data, capabilities }) => (
        <PageWrapper headerItem={
            data.contactorCmsLink ? <CmsLink
                canEdit={capabilities.canEditSpecialCmsLink.toJsObject()}
                className={styles.conactorLink}
                cmsLink={data.contactorCmsLink}
                updateCmsLinkAction={updateCareerSpecialCmsLinkAction}
            /> : <></>
        }>
            <div className={styles.wrapper}>
                <SpecialCmsParagraph
                    canEdit={capabilities.canEditSpecialCmsParagraph.toJsObject()}
                    className={styles.info}
                    special="CAREER_INFO"
                    readSpecialCmsParagraphAction={readSpecialCmsParagraphCareerInfo}
                    updateCmsParagraphAction={updateSpecialCmsParagraphContentCareerInfo}
                />
                <span className={styles.links}>
                    <Link href="/career/jobads">
                        <StandardImageServer
                            disableLinkingToLicense
                            className={styles.linkImage}
                            width={300}
                            standardImage="MACHINE"
                        />
                        <h2>Jobbannonser</h2>
                    </Link>
                    <Link href={`/events?${QueryParams.eventTags.encodeUrl(
                        data.companyPresentationEventTag ? [data.companyPresentationEventTag.name] : []
                    )}`}>
                        <StandardImageServer
                            disableLinkingToLicense
                            className={styles.linkImage}
                            width={300}
                            standardImage="FAIR"
                        />
                        <h2>Bedriftpresentasjoner</h2>
                    </Link>
                    <Link href="/career/companies">
                        <StandardImageServer
                            disableLinkingToLicense
                            className={styles.linkImage}
                            width={300}
                            standardImage="REALFAGSBYGGET"
                        />
                        <h2>Bedrifter</h2>
                    </Link>
                </span>
            </div>
        </PageWrapper>
    ),
})

export default page
export { generateMetadata }

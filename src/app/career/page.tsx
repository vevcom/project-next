import styles from './page.module.scss'
import SpecialCmsParagraph from '@/components/Cms/CmsParagraph/SpecialCmsParagraph'
import PageWrapper from '@/components/PageWrapper/PageWrapper'
import { ServerSession } from '@/auth/session/ServerSession'
import StandardImageServer from '@/components/Image/StandardImageServer'
import CmsLink from '@/components/Cms/CmsLink/CmsLink'
import { QueryParams } from '@/lib/queryParams/queryParams'
import { readSpecialEventTagAction } from '@/services/events/tags/actions'
import {
    readSpecialCmsParagraphCareerInfo,
    updateSpecialCmsParagraphContentCareerInfo,
    readCareerSpecialCmsLinkAction,
    updateCareerSpecialCmsLinkAction
} from '@/services/career/actions'
import { careerAuth } from '@/services/career/auth'
import Link from 'next/link'

export default async function CareerLandingPage() {
    const session = await ServerSession.fromNextAuth()
    const conactorCmsLinkRes = await readCareerSpecialCmsLinkAction({ params: { special: 'CAREER_LINK_TO_CONTACTOR' } })
    const companyPresentationEventTagRes = await readSpecialEventTagAction({ params: { special: 'COMPANY_PRESENTATION' } })

    const contactorCmsLink = conactorCmsLinkRes.success ? conactorCmsLinkRes.data : null
    const companyPresentationEventTag = companyPresentationEventTagRes.success ? companyPresentationEventTagRes.data : null

    const canEditSpecialCmsLink = careerAuth.updateSpecialCmsLink.auth(
        session
    ).toJsObject()
    const canEditSpecialCmsParagraph = careerAuth.updateSpecialCmsParagraphContentCareerInfo.auth(
        session
    ).toJsObject()

    return (
        <PageWrapper title={session.user ? 'Karriere' : 'For bedrifter'} headerItem={
            contactorCmsLink ? <CmsLink
                canEdit={canEditSpecialCmsLink}
                className={styles.conactorLink}
                cmsLink={contactorCmsLink}
                updateCmsLinkAction={updateCareerSpecialCmsLinkAction}
            /> : <></>
        }>
            <div className={styles.wrapper}>
                <SpecialCmsParagraph
                    canEdit={canEditSpecialCmsParagraph}
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
                        companyPresentationEventTag ? [companyPresentationEventTag.name] : []
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
    )
}

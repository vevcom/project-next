import styles from './page.module.scss'
import EditJobAd from './EditJobAd'
import Article from '@/components/Cms/Article/Article'
import CompanySelectionProvider from '@/contexts/CompanySelection'
import { CompanyPagingProvider } from '@/contexts/paging/CompanyPaging'
import Company from '@/components/Company/Company'
import Date from '@/components/Date/Date'
import {
    readJobAdAction,
    updateJobAdArticleAction,
    updateJobAdArticleAddSectionAction,
    updateJobAdArticleCmsImageAction,
    updateJobAdArticleCmsLinkAction,
    updateJobAdArticleCmsParagraphAction,
    updateJobAdArticleCoverImageAction,
    updateJobAdArticleReorderSectionsAction,
    updateJobAdArticleSectionAction,
    updateJobAdArticleSectionsAddPartAction,
    updateJobAdArticleSectionsRemovePartAction
} from '@/services/career/jobAds/actions'
import { jobAdType } from '@/services/career/jobAds/constants'
import { decodeVevenUriHandleError } from '@/lib/urlEncoding'
import { ServerSession } from '@/auth/session/ServerSession'
import { configureAction } from '@/services/configureAction'
import { jobAdAuth } from '@/services/career/jobAds/auth'
import PageTitleSetter from '@/contexts/PageTitleSetter'
import { notFound } from 'next/navigation'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
    faCheckCircle,
    faClock,
    faLocationDot,
    faNewspaper,
    faSuitcase,
    faXmarkCircle
} from '@fortawesome/free-solid-svg-icons'

type PropTypes = {
    params: Promise<{
        nameAndId: string
    }>
}

export default async function JobAd({ params }: PropTypes) {
    const nameAndId = (await params).nameAndId

    const session = await ServerSession.fromNextAuth()
    const jobAdRes = await readJobAdAction({ params: { id: decodeVevenUriHandleError(nameAndId) } })
    if (!jobAdRes.success) {
        //TODO: Handle error in idiomatic way
        if (jobAdRes.errorCode === 'NOT FOUND') notFound()
        throw new Error('Kunne ikke laste stillingsannonsen')
    }
    const jobAd = jobAdRes.data

    const canEdit = jobAdAuth.updateArticle.auth(
        session
    ).toJsObject()

    return (
        <div className={styles.wrapper}>
            <PageTitleSetter title={'Jobbannonse'} />
            <main className={styles.main}>
                <Article
                    canEdit={canEdit}
                    article={jobAd.article}
                    coverImageClass={styles.coverImage}
                    sideBarClassName={styles.sideBar}
                    articleClassName={styles.articleZone}
                    addSectionClassName={styles.addSectionZone}
                    actions={{
                        updateArticleAction: configureAction(
                            updateJobAdArticleAction,
                            { implementationParams: { jobAdId: jobAd.id } }
                        ),
                        updateCoverImageAction: configureAction(
                            updateJobAdArticleCoverImageAction,
                            { implementationParams: { jobAdId: jobAd.id } }
                        ),
                        addSectionToArticleAction: configureAction(
                            updateJobAdArticleAddSectionAction,
                            { implementationParams: { jobAdId: jobAd.id } }
                        ),
                        reorderArticleSectionsAction: configureAction(
                            updateJobAdArticleReorderSectionsAction,
                            { implementationParams: { jobAdId: jobAd.id } }
                        ),
                        articleSections: {
                            updateCmsParagraph: configureAction(
                                updateJobAdArticleCmsParagraphAction,
                                { implementationParams: { jobAdId: jobAd.id } }
                            ),
                            updateCmsImage: configureAction(
                                updateJobAdArticleCmsImageAction,
                                { implementationParams: { jobAdId: jobAd.id } }
                            ),
                            updateCmsLink: configureAction(
                                updateJobAdArticleCmsLinkAction,
                                { implementationParams: { jobAdId: jobAd.id } }
                            ),
                            updateArticleSection: configureAction(
                                updateJobAdArticleSectionAction,
                                { implementationParams: { jobAdId: jobAd.id } }
                            ),
                            addPartToArticleSection: configureAction(
                                updateJobAdArticleSectionsAddPartAction,
                                { implementationParams: { jobAdId: jobAd.id } }
                            ),
                            removePartFromArticleSection: configureAction(
                                updateJobAdArticleSectionsRemovePartAction,
                                { implementationParams: { jobAdId: jobAd.id } }
                            )
                        }
                    }}
                    sideBarContent={
                        <>
                            <ul className={styles.metInfo}>
                                <li>
                                    <FontAwesomeIcon icon={faSuitcase} />
                                    <h3>Stillingstype</h3>
                                    <p>{jobAdType[jobAd.type].label}</p>
                                </li>
                                <li>
                                    <FontAwesomeIcon icon={jobAd.active ? faCheckCircle : faXmarkCircle} />
                                    <h3>Status</h3>
                                    <p>{jobAd.active ? 'Denne jobbanonsen er aktiv' : 'Denne jobbanonsen er arkivert'}</p>
                                </li>
                                <li>
                                    <FontAwesomeIcon icon={faClock} />
                                    <h3>Søknadsfrist</h3>
                                    <p>
                                        { jobAd.applicationDeadline ?
                                            <Date date={jobAd.applicationDeadline} /> :
                                            'Ingen søknadsfrist satt'
                                        }
                                    </p>
                                </li>
                                <li>
                                    <FontAwesomeIcon icon={faNewspaper} />
                                    <h3>Publisert</h3>
                                    <p>
                                        <Date date={jobAd.createdAt} />
                                    </p>
                                </li>
                                <li>
                                    <FontAwesomeIcon icon={faLocationDot} />
                                    <h3>Sted</h3>
                                    <p>{jobAd.location}</p>
                                </li>
                            </ul>
                            <div className={styles.company}>
                                <h2>Arbeidsgiver</h2>
                                <Company
                                    disableEdit
                                    squareLogo={false}
                                    company={jobAd.company}
                                    session={session}
                                />
                            </div>
                        </>
                    } />
            </main>
            <CompanyPagingProvider
                serverRenderedData={[]}
                startPage={{
                    page: 0,
                    pageSize: 10
                }}
                details={{ name: undefined }}
            >
                <CompanySelectionProvider company={jobAd.company}>
                    <EditJobAd jobAd={jobAd}/>
                </CompanySelectionProvider>
            </CompanyPagingProvider>
        </div>

    )
}

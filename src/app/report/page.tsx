import styles from './page.module.scss'
import { unwrapActionReturn } from '@/app/redirectToErrorPage'
import {
    readReportArticleAction,
    updateReportArticleAction,
    updateReportArticleAddSectionAction,
    updateReportArticleCmsImageAction,
    updateReportArticleCmsLinkAction,
    updateReportArticleCmsParagraphAction,
    updateReportArticleCoverImageAction,
    updateReportArticleReorderSectionsAction,
    updateReportArticleSectionAction,
    updateReportArticleSectionsAddPartAction,
    updateReportArticleSectionsRemovePartAction
} from '@/services/report/actions'
import SpecialArticle from '@/cms/SpecialArticle/SpecialArticle'
import PageWrapper from '@/components/PageWrapper/PageWrapper'
import { reportAuth } from '@/services/report/auth'
import { ServerSession } from '@/auth/session/ServerSession'

export default async function Report() {
    const article = unwrapActionReturn(await readReportArticleAction())

    const canEdit = reportAuth.update.auth(
        await ServerSession.fromNextAuth()
    ).toJsObject()

    return (
        <PageWrapper title="Varsling" className={styles.reportPage}>
            <SpecialArticle
                article={article}
                canEdit={canEdit}
                actions={{
                    update: updateReportArticleAction,
                    addSection: updateReportArticleAddSectionAction,
                    reorderSections: updateReportArticleReorderSectionsAction,
                    coverImage: updateReportArticleCoverImageAction,
                    articleSections: {
                        update: updateReportArticleSectionAction,
                        addPart: updateReportArticleSectionsAddPartAction,
                        removePart: updateReportArticleSectionsRemovePartAction,
                        cmsImage: updateReportArticleCmsImageAction,
                        cmsParagraph: updateReportArticleCmsParagraphAction,
                        cmsLink: updateReportArticleCmsLinkAction,
                    }
                }}
            />
        </PageWrapper>
    )
}

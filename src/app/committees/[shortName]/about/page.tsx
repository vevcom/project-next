import styles from './page.module.scss'
import {
    readCommitteeArticleAction,
    updateCommitteeArticleAction,
    updateCommitteeArticleAddSectionAction,
    updateCommitteeArticleCmsImageAction,
    updateCommitteeArticleCmsLinkAction,
    updateCommitteeArticleCmsParagraphAction,
    updateCommitteeArticleCoverImageAction,
    updateCommitteeArticleReorderSectionsAction,
    updateCommitteeArticleSectionAction,
    updateCommitteeArticleSectionsAddPartAction,
    updateCommitteeArticleSectionsRemovePartAction
} from '@/services/groups/committees/actions'
import Article from '@/components/Cms/Article/Article'
import getCommittee from '@/app/committees/[shortName]/getCommittee'
import { configureAction } from '@/services/configureAction'
import { committeeAuth } from '@/services/groups/committees/auth'
import { ServerSession } from '@/auth/session/ServerSession'

export type PropTypes = {
    params: Promise<{
        shortName: string
    }>
}

export default async function committeeArticle({ params }: PropTypes) {
    const shortName = (await params).shortName
    const committeeArticleRes = await readCommitteeArticleAction({ params: await params })
    if (!committeeArticleRes.success) throw new Error('Kunne ikke hente komitéartikkel')
    const article = committeeArticleRes.data

    const committee = await getCommittee(params)

    const canEdit = committeeAuth.updateArticle.data({ groupId: committee.groupId }).auth(
        await ServerSession.fromNextAuth()
    ).toJsObject()

    return (
        <div className={styles.wrapper}>
            <Article
                canEdit={canEdit}
                article={article}
                hideCoverImage
                noMargin
                actions={{
                    updateArticleAction: configureAction(
                        updateCommitteeArticleAction,
                        { implementationParams: { shortName } }
                    ),
                    updateCoverImageAction: configureAction(
                        updateCommitteeArticleCoverImageAction,
                        { implementationParams: { shortName } }
                    ),
                    addSectionToArticleAction: configureAction(
                        updateCommitteeArticleAddSectionAction,
                        { implementationParams: { shortName } }
                    ),
                    reorderArticleSectionsAction: configureAction(
                        updateCommitteeArticleReorderSectionsAction,
                        { implementationParams: { shortName } }
                    ),
                    articleSections: {
                        updateCmsParagraph: configureAction(
                            updateCommitteeArticleCmsParagraphAction,
                            { implementationParams: { shortName } }
                        ),
                        updateCmsImage: configureAction(
                            updateCommitteeArticleCmsImageAction,
                            { implementationParams: { shortName } }
                        ),
                        updateCmsLink: configureAction(
                            updateCommitteeArticleCmsLinkAction,
                            { implementationParams: { shortName } }
                        ),
                        updateArticleSection: configureAction(
                            updateCommitteeArticleSectionAction,
                            { implementationParams: { shortName } }
                        ),
                        addPartToArticleSection: configureAction(
                            updateCommitteeArticleSectionsAddPartAction,
                            { implementationParams: { shortName } }
                        ),
                        removePartFromArticleSection: configureAction(
                            updateCommitteeArticleSectionsRemovePartAction,
                            { implementationParams: { shortName } }
                        )
                    }
                }}
            />
        </div>
    )
}

import styles from './page.module.scss'
import Article from '@/cms/Article/Article'
import { configureAction } from '@/services/configureAction'
import {
    readArticleCategoryAction,
    readArticleInCategoryAction,
    updateArticleCategoryArticleAction,
    updateArticleCategoryArticleAddSectionAction,
    updateArticleCategoryArticleCmsImageAction,
    updateArticleCategoryArticleCmsLinkAction,
    updateArticleCategoryArticleCmsParagraphAction,
    updateArticleCategoryArticleCoverImageAction,
    updateArticleCategoryArticleReorderSectionsAction,
    updateArticleCategoryArticleSectionAction,
    updateArticleCategoryArticleSectionsAddPartAction,
    updateArticleCategoryArticleSectionsRemovePartAction
} from '@/services/articleCategories/actions'
import { decodeVevenUriHandleError } from '@/lib/urlEncoding'
import { unwrapActionReturn } from '@/app/redirectToErrorPage'
import { ServerSession } from '@/auth/session/ServerSession'
import { articleCategoryAuth } from '@/services/articleCategories/auth'

type PropTypes = {
    params: Promise<{
        category: string
        nameAndId: string
    }>,
}

export default async function ArticleCategoryPage({ params }: PropTypes) {
    const articleId = decodeVevenUriHandleError((await params).nameAndId)
    const categoryName = decodeURIComponent((await params).category)

    const articleCategory = unwrapActionReturn(
        await readArticleCategoryAction({ params: { name: categoryName } })
    )

    const article = unwrapActionReturn(
        await readArticleInCategoryAction({
            implementationParams: {
                articleCategoryName: categoryName
            }
        }, {
            params: {
                articleId,
            }
        })
    )

    const canEdit = articleCategoryAuth.updateArticle.auth(
        await ServerSession.fromNextAuth()
    ).toJsObject()

    return (
        <div className={styles.wrapper}>
            <Article
                canEdit={canEdit}
                coverImageClass={styles.coverImage}
                article={article}
                actions={{
                    updateArticleAction: configureAction(
                        updateArticleCategoryArticleAction,
                        { implementationParams: { articleCategoryId: articleCategory.id } }
                    ),
                    updateCoverImageAction: configureAction(
                        updateArticleCategoryArticleCoverImageAction,
                        { implementationParams: { articleCategoryId: articleCategory.id } }
                    ),
                    addSectionToArticleAction: configureAction(
                        updateArticleCategoryArticleAddSectionAction,
                        { implementationParams: { articleCategoryId: articleCategory.id } }
                    ),
                    reorderArticleSectionsAction: configureAction(
                        updateArticleCategoryArticleReorderSectionsAction,
                        { implementationParams: { articleCategoryId: articleCategory.id } }
                    ),
                    articleSections: {
                        updateCmsParagraph: configureAction(
                            updateArticleCategoryArticleCmsParagraphAction,
                            { implementationParams: { articleCategoryId: articleCategory.id } }
                        ),
                        updateCmsImage: configureAction(
                            updateArticleCategoryArticleCmsImageAction,
                            { implementationParams: { articleCategoryId: articleCategory.id } }
                        ),
                        updateCmsLink: configureAction(
                            updateArticleCategoryArticleCmsLinkAction,
                            { implementationParams: { articleCategoryId: articleCategory.id } }
                        ),
                        updateArticleSection: configureAction(
                            updateArticleCategoryArticleSectionAction,
                            { implementationParams: { articleCategoryId: articleCategory.id } }
                        ),
                        addPartToArticleSection: configureAction(
                            updateArticleCategoryArticleSectionsAddPartAction,
                            { implementationParams: { articleCategoryId: articleCategory.id } }
                        ),
                        removePartFromArticleSection: configureAction(
                            updateArticleCategoryArticleSectionsRemovePartAction,
                            { implementationParams: { articleCategoryId: articleCategory.id } }
                        )
                    }
                }}
            />
        </div>
    )
}

import Article, { type PropTypes } from '@/cms/Article/Article'
import { configureAction } from '@/services/configureAction'
import type { SpecialArticleActions } from '@/cms/articles/types'

/**
 * Renders a special article - one owned by a service through implementSpecialArticle - for whichever
 * service owns it. The owner passes its own actions, because the article's `special` is fixed inside
 * the service: no service-specific id or params reach this component, only the actions themselves.
 *
 * The implementationParams are always undefined for a special article, so binding them here saves
 * every owner from repeating the same configureAction calls.
 */
export default function SpecialArticle({ actions, ...props }: Omit<PropTypes, 'actions'> & {
    actions: SpecialArticleActions,
}) {
    return (
        <Article {...props} actions={{
            updateArticleAction: configureAction(
                actions.update,
                { implementationParams: undefined }
            ),
            updateCoverImageAction: configureAction(
                actions.coverImage,
                { implementationParams: undefined }
            ),
            addSectionToArticleAction: configureAction(
                actions.addSection,
                { implementationParams: undefined }
            ),
            reorderArticleSectionsAction: configureAction(
                actions.reorderSections,
                { implementationParams: undefined }
            ),
            articleSections: {
                updateCmsParagraph: configureAction(
                    actions.articleSections.cmsParagraph,
                    { implementationParams: undefined }
                ),
                updateCmsImage: configureAction(
                    actions.articleSections.cmsImage,
                    { implementationParams: undefined }
                ),
                updateCmsLink: configureAction(
                    actions.articleSections.cmsLink,
                    { implementationParams: undefined }
                ),
                updateArticleSection: configureAction(
                    actions.articleSections.update,
                    { implementationParams: undefined }
                ),
                addPartToArticleSection: configureAction(
                    actions.articleSections.addPart,
                    { implementationParams: undefined }
                ),
                removePartFromArticleSection: configureAction(
                    actions.articleSections.removePart,
                    { implementationParams: undefined }
                )
            }
        }} />
    )
}

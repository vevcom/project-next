import type { Article, ArticleCategory } from '@/prisma-generated-pn-types'
import type { ExpandedImage } from '@/services/images/subservice/types'
import type { DoubleLevelVisibilityMatrix } from '@/services/visibility/types'

export type ExpandedArticleCategory = ArticleCategory & { articles: Article[] }

export type ExpandedArticleCategoryWithCover = ExpandedArticleCategory & { coverImage: ExpandedImage | null }

export type ArticleCategoryWithCover = ArticleCategory & { coverImage: ExpandedImage | null }

/**
 * A category as read for its own pages: with both visibility levels, so the client can decide which
 * editing controls to show without reading them separately.
 */
export type ExpandedArticleCategoryWithVisibility = ExpandedArticleCategory & {
    visibility: DoubleLevelVisibilityMatrix
}

import type { Article, ArticleCategory } from '@/prisma-generated-pn-types'

export type ExpandedArticleCategory = ArticleCategory & { articles: Article[] }

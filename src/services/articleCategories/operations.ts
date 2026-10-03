import '@pn-server-only'
import { articleCategoryAuth } from './auth'
import { articleCategorySchemas } from './schemas'
import { defineOperation } from '@/services/serviceOperation'
import { ServerError } from '@/services/error'
import { implementUpdateArticleOperations } from '@/cms/articles/implement'
import { articleOperations } from '@/cms/articles/operations'
import { expandedImageIncluder } from '@/services/images/subservice/constants'
import { z } from 'zod'
import type { ExpandedArticleCategory } from './types'
import type { ExpandedImage } from '@/services/images/subservice/types'
import type { PrismaPossibleTransaction } from '@/services/serviceOperation'

export const articleCategoryOperations = {
    create: defineOperation({
        authorizer: () => articleCategoryAuth.create,
        dataSchema: articleCategorySchemas.create,
        operation: ({ prisma, data }) =>
            prisma.articleCategory.create({
                data,
                include: {
                    articles: true
                },
            })
    }),

    destroy: defineOperation({
        authorizer: () => articleCategoryAuth.destroy,
        paramsSchema: z.object({
            id: z.number()
        }),
        operation: async ({ prisma, params }) => {
            // There is onDelete cascade on articles when article category is deleted
            // however coverImages of articles on articles are not cascade deleted when articles are
            // Thus we call the destroy operation on all articles to fix this
            const allArticles = await prisma.article.findMany({
                where: {
                    articleCategoryId: params.id
                }
            })
            await Promise.all(allArticles.map(article =>
                articleOperations.destroy.internalCall({ params: { articleId: article.id } })
            ))

            return await prisma.articleCategory.delete({
                where: {
                    id: params.id
                },
                include: {
                    articles: true
                }
            })
        }
    }),

    update: defineOperation({
        authorizer: () => articleCategoryAuth.update,
        paramsSchema: z.object({
            id: z.number(),
        }),
        dataSchema: articleCategorySchemas.update,
        operation: ({ prisma, data, params }) =>
            prisma.articleCategory.update({
                where: {
                    id: params.id
                },
                data,
                include: {
                    articles: true
                }
            })
    }),

    addArticleToCategory: defineOperation({
        authorizer: () => articleCategoryAuth.addArticleToCategory,
        paramsSchema: z.object({
            id: z.number()
        }),
        opensTransaction: true,
        operation: ({ prisma, params }) =>
            prisma.$transaction(async (tx) => {
                const article = await articleOperations.create.internalCall({
                    data: {},
                    prisma: tx,
                    dataSchemaImplementationFields: { maxNameLength: 30 },
                    operationImplementationFields: { special: null }
                })
                await tx.articleCategory.update({
                    where: {
                        id: params.id
                    },
                    data: {
                        articles: {
                            connect: {
                                id: article.id
                            }
                        }
                    }
                })
                return article
            })
    }),

    removeArticleFromCategory: defineOperation({
        authorizer: () => articleCategoryAuth.removeArticleFromCategory,
        paramsSchema: z.object({
            id: z.number(),
            articleId: z.number()
        }),
        operation: async ({ prisma, params }) => {
            //check ownership:
            const article = await prisma.article.findUnique({
                where: {
                    id: params.articleId
                }
            })
            if (!article) throw new ServerError('NOT FOUND', `Article ${params.articleId} not found`)
            if (article.articleCategoryId !== params.id) {
                throw new ServerError(
                    'BAD PARAMETERS',
                    `Article ${params.articleId} does not belong to category ${params.id}`
                )
            }

            await articleOperations.destroy.internalCall({ params: { articleId: params.articleId } })
        }
    }),

    updateArticle: implementUpdateArticleOperations({
        authorizer: () => articleCategoryAuth.updateArticle,
        implementationParamsSchema: z.object({
            articleCategoryId: z.number(),
        }),
        ownedArticles: ({ implementationParams, prisma }) => prisma.article.findMany({
            where: {
                articleCategoryId: implementationParams.articleCategoryId
            },
            include: {
                coverImage: true,
                articleSections: {
                    include: {
                        cmsImage: true,
                        cmsLink: true,
                        cmsParagraph: true
                    }
                }
            }
        })
    }),

    readAll: defineOperation({
        authorizer: () => articleCategoryAuth.readAll,
        operation: async ({ prisma }) => {
            const categories = await prisma.articleCategory.findMany({
                include: {
                    articles: {
                        take: 1,
                        include: {
                            coverImage: true
                        }
                    },
                },
                orderBy: {
                    createdAt: 'desc'
                }
            })
            const categoriesWithCover = await Promise.all(categories.map(async category => (
                {
                    ...category,
                    coverImage: (await getCoverImage(prisma, category))
                }
            )))
            return categoriesWithCover
        }
    }),

    read: defineOperation({
        authorizer: () => articleCategoryAuth.read,
        paramsSchema: z.object({
            name: z.string()
        }),
        operation: async ({ prisma, params }) => {
            const category = await prisma.articleCategory.findUnique({
                where: {
                    name: params.name
                },
                include: {
                    articles: {
                        orderBy: {
                            createdAt: 'desc'
                        }
                    }
                },
            })
            if (!category) throw new ServerError('NOT FOUND', `Category ${params.name} not found`)
            const categoryWithCover = {
                ...category,
                coverImage: await getCoverImage(prisma, category)
            }
            return categoryWithCover
        }
    }),

    readArticleInCategory: articleOperations.read.implement({
        authorizer: () => articleCategoryAuth.readArticleInCategory,
        implementationParamsSchema: z.object({
            articleCategoryName: z.string()
        }),
        ownershipCheck: async ({ prisma, params, implementationParams }) => {
            const article = await prisma.article.findUnique({
                where: {
                    id: params.articleId
                }
            })
            const articleCategoryId = await prisma.articleCategory.findUniqueOrThrow({
                where: {
                    name: implementationParams.articleCategoryName
                },
                select: {
                    id: true
                }
            }).then(res => res.id)
            if (!article) throw new ServerError('NOT FOUND', 'Artikkel ikke funnet.')
            return article.articleCategoryId ? article.articleCategoryId === articleCategoryId : false
        }
    })
} as const

/**
 * Get coverimage (not cmsImage just the image it relates to) for article category
 * Returns coverImage of a article in the category. The cover image for the category is the cover
 * image of the first article in the category.
 * @param category - The category to get cover image for
 * @returns The cover image of the category
 */
async function getCoverImage(
    prisma: PrismaPossibleTransaction<false>,
    category: ExpandedArticleCategory
): Promise<ExpandedImage | null> {
    if (category.articles.length === 0) return null
    const coverImage = await prisma.cmsImage.findUnique({
        where: {
            id: category.articles[0].coverImageId
        },
        include: {
            image: { include: expandedImageIncluder }
        }
    })
    if (!coverImage) return null
    if (!coverImage.image) return null
    return coverImage.image
}

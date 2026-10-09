import '@pn-server-only'
import { articleCategoryAuth } from './auth'
import { articleCategorySchemas } from './schemas'
import { defineOperation } from '@/services/serviceOperation'
import { ServiceError } from '@/services/error'
import { implementUpdateArticleOperations } from '@/cms/articles/implement'
import { articleOperations } from '@/cms/articles/operations'
import { expandedImageIncluder } from '@/services/images/subservice/constants'
import { z } from 'zod'

/** The cover of a category is the cover image of its newest article. */
const coverImageSelection = {
    coverImage: {
        select: { image: { include: expandedImageIncluder } },
    },
} as const

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
        opensTransaction: true,
        operation: async ({ prisma, params }) => prisma.$transaction(async (tx) => {
            // The articles cascade with the category, but their cover images would stay behind:
            // the relation is on the article. Destroying each article takes its cover with it.
            const articles = await tx.article.findMany({
                where: { articleCategoryId: params.id },
                select: { id: true },
            })
            await Promise.all(articles.map(article =>
                articleOperations.destroy.internalCall({ params: { articleId: article.id }, prisma: tx })
            ))
            return tx.articleCategory.delete({ where: { id: params.id } })
        }),
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
            const article = await prisma.article.findUnique({
                where: { id: params.articleId },
                select: { articleCategoryId: true },
            })
            if (!article) throw new ServiceError('NOT FOUND', `Article ${params.articleId} not found`)
            if (article.articleCategoryId !== params.id) {
                throw new ServiceError(
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
                        orderBy: { createdAt: 'desc' },
                        select: coverImageSelection,
                    },
                },
                orderBy: {
                    createdAt: 'desc'
                }
            })
            return categories.map(({ articles, ...category }) => ({
                ...category,
                coverImage: articles[0]?.coverImage.image ?? null,
            }))
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
            if (!category) throw new ServiceError('NOT FOUND', `Category ${params.name} not found`)
            const newestArticle = category.articles[0]
            const coverImage = newestArticle ? await prisma.cmsImage.findUniqueOrThrow({
                where: { id: newestArticle.coverImageId },
                select: coverImageSelection.coverImage.select,
            }).then(cover => cover.image) : null
            return { ...category, coverImage }
        }
    }),

    readArticleInCategory: articleOperations.read.implement({
        authorizer: () => articleCategoryAuth.readArticleInCategory,
        implementationParamsSchema: z.object({
            articleCategoryName: z.string()
        }),
        ownershipCheck: async ({ prisma, params, implementationParams }) => {
            const article = await prisma.article.findUnique({
                where: { id: params.articleId },
                select: { articleCategoryId: true },
            })
            if (!article) throw new ServiceError('NOT FOUND', 'Artikkel ikke funnet.')
            const category = await prisma.articleCategory.findUniqueOrThrow({
                where: { name: implementationParams.articleCategoryName },
                select: { id: true },
            })
            return article.articleCategoryId === category.id
        }
    })
} as const

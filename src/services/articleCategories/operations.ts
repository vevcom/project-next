import '@pn-server-only'
import { articleCategoryAuth } from './auth'
import { articleCategorySchemas } from './schemas'
import { defineOperation } from '@/services/serviceOperation'
import { ServiceError } from '@/services/error'
import { implementUpdateArticleOperations } from '@/cms/articles/implement'
import { articleOperations } from '@/cms/articles/operations'
import { expandedImageIncluder } from '@/services/images/subservice/constants'
import { visibilityOperations } from '@/services/visibility/operations'
import {
    assertAdminLevelIsSubOfRegularLevel,
    implementDoubleLevelVisibilityOperations
} from '@/services/visibility/implement'
import { z } from 'zod'
import type { ExpandedArticleCategory } from './types'
import type { ExpandedImage } from '@/services/images/subservice/types'
import type { PrismaPossibleTransaction } from '@/services/serviceOperation'

const visibility = implementDoubleLevelVisibilityOperations({
    implementationParamsSchema: articleCategorySchemas.params,
    authorizers: {
        readDoubleLevelMatrix: ({ doubleLevelMatrix }) =>
            articleCategoryAuth.readDoubleLevelMatrix.data({ visibility: doubleLevelMatrix }),
        updateRegularLevel: ({ doubleLevelMatrix }) =>
            articleCategoryAuth.updateRegularLevel.data({ visibility: doubleLevelMatrix }),
        updateAdminLevel: ({ doubleLevelMatrix }) =>
            articleCategoryAuth.updateAdminLevel.data({ visibility: doubleLevelMatrix })
    },
    readDoubleLevel: async ({ prisma, implementationParams, include }) => {
        const category = await prisma.articleCategory.findUniqueOrThrow({
            where: { id: implementationParams.id },
            include: {
                visibilityRegular: { include },
                visibilityAdmin: { include }
            }
        })
        return {
            regularLevel: category.visibilityRegular,
            adminLevel: category.visibilityAdmin
        }
    }
})

/**
 * The pages address a category by its name, the operations that change it by its id.
 */
async function readDoubleLevelMatrixByName(prisma: PrismaPossibleTransaction<false>, name: string) {
    const { id } = await prisma.articleCategory.findUniqueOrThrow({
        where: { name },
        select: { id: true }
    })
    return visibility.readDoubleLevelMatrixInternal({ params: { id }, prisma })
}

export const articleCategoryOperations = {
    visibility,

    create: defineOperation({
        authorizer: () => articleCategoryAuth.create,
        dataSchema: articleCategorySchemas.create,
        opensTransaction: true,
        operation: async ({ prisma, data }) => {
            assertAdminLevelIsSubOfRegularLevel({
                regularLevel: { requirements: data.visibilityRegularRequirements },
                adminLevel: { requirements: data.visibilityAdminRequirements },
            })

            return prisma.$transaction(async tx => {
                const visibilityRegular = await visibilityOperations.createWithRequirements.internalCall({
                    prisma: tx,
                    data: { requirements: data.visibilityRegularRequirements },
                })
                const visibilityAdmin = await visibilityOperations.createWithRequirements.internalCall({
                    prisma: tx,
                    data: { requirements: data.visibilityAdminRequirements },
                })

                return await tx.articleCategory.create({
                    data: {
                        name: data.name,
                        description: data.description,
                        visibilityRegular: {
                            connect: {
                                id: visibilityRegular.id
                            }
                        },
                        visibilityAdmin: {
                            connect: {
                                id: visibilityAdmin.id
                            }
                        },
                    },
                    include: {
                        articles: true
                    },
                })
            })
        }
    }),

    destroy: defineOperation({
        authorizer: () => articleCategoryAuth.destroy,
        paramsSchema: articleCategorySchemas.params,
        opensTransaction: true,
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

            return await prisma.$transaction(async tx => {
                const category = await tx.articleCategory.delete({
                    where: {
                        id: params.id
                    },
                    include: {
                        articles: true
                    }
                })
                await visibilityOperations.destroy.internalCall({
                    prisma: tx,
                    params: { visibilityId: category.visibilityAdminId },
                })
                await visibilityOperations.destroy.internalCall({
                    prisma: tx,
                    params: { visibilityId: category.visibilityRegularId },
                })
                return category
            })
        }
    }),

    update: defineOperation({
        authorizer: async ({ params, prisma }) => articleCategoryAuth.update.data({
            visibility: await visibility.readDoubleLevelMatrixInternal({ params, prisma })
        }),
        paramsSchema: articleCategorySchemas.params,
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
        authorizer: async ({ params, prisma }) => articleCategoryAuth.addArticleToCategory.data({
            visibility: await visibility.readDoubleLevelMatrixInternal({ params, prisma })
        }),
        paramsSchema: articleCategorySchemas.params,
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
        authorizer: async ({ params, prisma }) => articleCategoryAuth.removeArticleFromCategory.data({
            visibility: await visibility.readDoubleLevelMatrixInternal({ params: { id: params.id }, prisma })
        }),
        paramsSchema: articleCategorySchemas.params.extend({
            articleId: z.number()
        }),
        operation: async ({ prisma, params }) => {
            //check ownership:
            const article = await prisma.article.findUnique({
                where: {
                    id: params.articleId
                }
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
        authorizer: async ({ implementationParams, prisma }) => articleCategoryAuth.updateArticle.data({
            visibility: await visibility.readDoubleLevelMatrixInternal({
                params: { id: implementationParams.articleCategoryId },
                prisma
            })
        }),
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
        operation: async ({ prisma }, prismaWhereFilter) => {
            const categories = await prisma.articleCategory.findMany({
                // No filter means the session bypasses the regular level with ARTICLE_CATEGORY_ADMIN.
                where: prismaWhereFilter ? { visibilityRegular: prismaWhereFilter } : undefined,
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

    /**
     * Returns the category with both of its visibility levels, so the pages under it can decide which
     * editing controls to show.
     */
    read: defineOperation({
        authorizer: async ({ params, prisma }) => articleCategoryAuth.read.data({
            visibility: await readDoubleLevelMatrixByName(prisma, params.name)
        }),
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
            const categoryWithCover = {
                ...category,
                coverImage: await getCoverImage(prisma, category),
                visibility: await visibility.readDoubleLevelMatrixInternal({ params: { id: category.id }, prisma }),
            }
            return categoryWithCover
        }
    }),

    readArticleInCategory: articleOperations.read.implement({
        authorizer: async ({ implementationParams, prisma }) => articleCategoryAuth.readArticleInCategory.data({
            visibility: await readDoubleLevelMatrixByName(prisma, implementationParams.articleCategoryName)
        }),
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
            if (!article) throw new ServiceError('NOT FOUND', 'Artikkel ikke funnet.')
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

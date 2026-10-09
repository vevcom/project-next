import { Session } from '@/auth/session/Session'
import { prisma } from '@/prisma-pn-client-instance'
import { articleCategoryOperations } from '@/services/articleCategories/operations'
import { describe, expect, test } from '@jest/globals'

const session = Session.empty()

describe('article categories', () => {
    test('destroying a category takes its articles and their cover images with it', async () => {
        const category = await articleCategoryOperations.create({
            data: { name: 'Kategori', description: 'Til sletting' },
            session,
        })
        const article = await articleCategoryOperations.addArticleToCategory({ params: { id: category.id }, session })
        expect(await prisma.cmsImage.findUnique({ where: { id: article.coverImageId } })).not.toBeNull()

        await articleCategoryOperations.destroy({ params: { id: category.id }, session })

        expect(await prisma.articleCategory.findUnique({ where: { id: category.id } })).toBeNull()
        expect(await prisma.article.findUnique({ where: { id: article.id } })).toBeNull()
        expect(await prisma.cmsImage.findUnique({ where: { id: article.coverImageId } })).toBeNull()
    })

    test('a category is read with the cover image of its newest article', async () => {
        const category = await articleCategoryOperations.create({
            data: { name: 'Forsidebilde', description: 'Uten bilde' },
            session,
        })
        await articleCategoryOperations.addArticleToCategory({ params: { id: category.id }, session })

        const read = await articleCategoryOperations.read({ params: { name: 'Forsidebilde' }, session })
        expect(read.articles).toHaveLength(1)
        expect(read.coverImage).toBeNull()

        const all = await articleCategoryOperations.readAll({ session })
        expect(all.find(candidate => candidate.id === category.id)?.coverImage).toBeNull()
    })
})

import { Smorekopp } from '@/services/error'
import { articleOperations } from '@/services/cms/articles/operations'
import { describe, expect, test } from '@jest/globals'

const createArticle = (name?: string) => articleOperations.create.internalCall({
    data: { name },
    dataSchemaImplementationFields: { maxNameLength: 30 },
    operationImplementationFields: { special: null },
})

const addSection = (articleId: number, includeParts: { cmsImage?: boolean, cmsParagraph?: boolean, cmsLink?: boolean }) =>
    articleOperations.addSection.internalCall({ params: { articleId }, data: { includeParts } })

const reorder = (articleId: number, sectionId: number, direction: 'UP' | 'DOWN') =>
    articleOperations.reorderSections.internalCall({ params: { articleId, sectionId }, data: { direction } })

describe('articles', () => {
    test('an unnamed article gets the first free "Ny artikkel" name', async () => {
        const first = await createArticle()
        const second = await createArticle()
        expect(first.name).toMatch(/^Ny artikkel( \d+)?$/)
        expect(second.name).toMatch(/^Ny artikkel( \d+)?$/)
        expect(second.name).not.toBe(first.name)
    })

    test('a section is added after the last one, with the parts asked for', async () => {
        const article = await createArticle('Med seksjoner')
        await addSection(article.id, { cmsParagraph: true })
        const withTwo = await addSection(article.id, { cmsImage: true, cmsLink: true })

        const sections = [...withTwo.articleSections].sort((one, other) => one.order - other.order)
        expect(sections.map(section => section.order)).toEqual([0, 1])
        expect(sections[0].cmsParagraph).not.toBeNull()
        expect(sections[0].cmsImage).toBeNull()
        expect(sections[1].cmsImage).not.toBeNull()
        expect(sections[1].cmsLink).not.toBeNull()
        expect(sections[1].cmsParagraph).toBeNull()

        await reorder(article.id, sections[0].id, 'DOWN')
        const reordered = await articleOperations.read.internalCall({ params: { articleId: article.id } })
        const orderOf = (sectionId: number) => reordered.articleSections.find(section => section.id === sectionId)?.order
        expect(orderOf(sections[0].id)).toBe(1)
        expect(orderOf(sections[1].id)).toBe(0)
        await expect(reorder(article.id, sections[1].id, 'UP')).rejects.toThrow(Smorekopp)
    })
})

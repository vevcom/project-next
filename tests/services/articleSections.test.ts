import { Smorekopp } from '@/services/error'
import { prisma } from '@/prisma-pn-client-instance'
import { articleSectionOperations } from '@/services/cms/articleSections/operations'
import { describe, expect, test } from '@jest/globals'
import type { ArticleSectionPart } from '@/services/cms/articleSections/types'

const addPart = (articleSectionId: number, part: ArticleSectionPart) => articleSectionOperations.addPart.internalCall({
    params: { articleSectionId },
    data: { part },
})

const removePart = (articleSectionId: number, part: ArticleSectionPart, destroyOnEmpty: boolean) =>
    articleSectionOperations.removePart.internalCall({
        params: { articleSectionId },
        data: { part },
        operationImplementationFields: { destroyOnEmpty },
    })

describe('article sections', () => {
    test('hold at most one part of each kind', async () => {
        const section = await articleSectionOperations.create.internalCall({ data: {} })

        await addPart(section.id, 'cmsImage')
        await addPart(section.id, 'cmsParagraph')
        const withLink = await addPart(section.id, 'cmsLink')
        expect(withLink.cmsImage).not.toBeNull()
        expect(withLink.cmsParagraph).not.toBeNull()
        expect(withLink.cmsLink?.text).toBe('lenke')

        await expect(addPart(section.id, 'cmsImage')).rejects.toThrow(Smorekopp)
    })

    test('go when their last part goes, if asked to', async () => {
        const section = await articleSectionOperations.create.internalCall({ data: {} })
        await addPart(section.id, 'cmsParagraph')
        const withLink = await addPart(section.id, 'cmsLink')

        const withoutLink = await removePart(section.id, 'cmsLink', true)
        expect(withoutLink.cmsLink).toBeNull()
        expect(withoutLink.cmsParagraph).not.toBeNull()
        expect(await prisma.cmsLink.findUnique({ where: { id: withLink.cmsLink!.id } })).toBeNull()
        await expect(removePart(section.id, 'cmsLink', true)).rejects.toThrow(Smorekopp)

        await removePart(section.id, 'cmsParagraph', false)
        expect(await prisma.articleSection.findUnique({ where: { id: section.id } })).not.toBeNull()

        const kept = await articleSectionOperations.create.internalCall({ data: {} })
        await addPart(kept.id, 'cmsImage')
        await removePart(kept.id, 'cmsImage', true)
        expect(await prisma.articleSection.findUnique({ where: { id: kept.id } })).toBeNull()
    })
})

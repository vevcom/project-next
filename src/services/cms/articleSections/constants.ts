import { expandedImageIncluder } from '@/services/images/subservice/constants'
import type { Prisma } from '@/prisma-generated-pn-types'

export const maxImageSize = 540
export const minImageSize = 130
export const imageSizeIncrement = 20

export const articleSectionsRelationsIncluder = {
    cmsImage: {
        include: {
            image: { include: expandedImageIncluder }
        }
    },
    cmsParagraph: true,
    cmsLink: true,
} as const satisfies Prisma.ArticleSectionInclude

export const articleSectionParts = ['cmsImage', 'cmsParagraph', 'cmsLink'] as const

/** A new, empty part of each kind, nested in the write of the section it goes into. */
export const emptyArticleSectionPart = {
    cmsImage: { cmsImage: { create: {} } },
    cmsParagraph: { cmsParagraph: { create: {} } },
    cmsLink: { cmsLink: { create: { text: 'lenke', url: './' } } },
} as const satisfies Record<typeof articleSectionParts[number], Prisma.ArticleSectionUpdateInput>

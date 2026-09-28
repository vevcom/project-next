import { unwrapActionReturn } from '@/app/redirectToErrorPage'
import {
    readCabinArticleAction,
    updateCabinArticleAction,
    updateCabinArticleAddSectionAction,
    updateCabinArticleCmsImageAction,
    updateCabinArticleCmsLinkAction,
    updateCabinArticleCmsParagraphAction,
    updateCabinArticleCoverImageAction,
    updateCabinArticleReorderSectionsAction,
    updateCabinArticleSectionAction,
    updateCabinArticleSectionsAddPartAction,
    updateCabinArticleSectionsRemovePartAction
} from '@/services/cabin/article/actions'
import SpecialArticle from '@/cms/SpecialArticle/SpecialArticle'
import PageWrapper from '@/components/PageWrapper/PageWrapper'
import { cabinArticleAuth } from '@/services/cabin/article/auth'
import { ServerSession } from '@/auth/session/ServerSession'
import Link from 'next/link'

export default async function Cabin() {
    const article = unwrapActionReturn(await readCabinArticleAction())

    const canEdit = cabinArticleAuth.update.dynamicFields({}).auth(
        await ServerSession.fromNextAuth()
    ).toJsObject()

    return (
        <PageWrapper title="Heutten" headerItem={<Link href="/cabin/book">Trykk her for å Booke</Link>}>
            <SpecialArticle
                article={article}
                canEdit={canEdit}
                actions={{
                    update: updateCabinArticleAction,
                    addSection: updateCabinArticleAddSectionAction,
                    reorderSections: updateCabinArticleReorderSectionsAction,
                    coverImage: updateCabinArticleCoverImageAction,
                    articleSections: {
                        update: updateCabinArticleSectionAction,
                        addPart: updateCabinArticleSectionsAddPartAction,
                        removePart: updateCabinArticleSectionsRemovePartAction,
                        cmsImage: updateCabinArticleCmsImageAction,
                        cmsParagraph: updateCabinArticleCmsParagraphAction,
                        cmsLink: updateCabinArticleCmsLinkAction,
                    }
                }}
            />
        </PageWrapper>
    )
}

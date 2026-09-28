import { unwrapActionReturn } from '@/app/redirectToErrorPage'
import {
    readNewStudentArticleAction,
    updateNewStudentArticleAction,
    updateNewStudentArticleAddSectionAction,
    updateNewStudentArticleCmsImageAction,
    updateNewStudentArticleCmsLinkAction,
    updateNewStudentArticleCmsParagraphAction,
    updateNewStudentArticleCoverImageAction,
    updateNewStudentArticleReorderSectionsAction,
    updateNewStudentArticleSectionAction,
    updateNewStudentArticleSectionsAddPartAction,
    updateNewStudentArticleSectionsRemovePartAction
} from '@/services/newStudent/actions'
import SpecialArticle from '@/cms/SpecialArticle/SpecialArticle'
import PageWrapper from '@/components/PageWrapper/PageWrapper'
import { newStudentAuth } from '@/services/newStudent/auth'
import { ServerSession } from '@/auth/session/ServerSession'

export default async function NewStudent() {
    const article = unwrapActionReturn(await readNewStudentArticleAction())

    const canEdit = newStudentAuth.update.dynamicFields({}).auth(
        await ServerSession.fromNextAuth()
    ).toJsObject()

    return (
        <PageWrapper title="Ny student">
            <SpecialArticle
                article={article}
                canEdit={canEdit}
                actions={{
                    update: updateNewStudentArticleAction,
                    addSection: updateNewStudentArticleAddSectionAction,
                    reorderSections: updateNewStudentArticleReorderSectionsAction,
                    coverImage: updateNewStudentArticleCoverImageAction,
                    articleSections: {
                        update: updateNewStudentArticleSectionAction,
                        addPart: updateNewStudentArticleSectionsAddPartAction,
                        removePart: updateNewStudentArticleSectionsRemovePartAction,
                        cmsImage: updateNewStudentArticleCmsImageAction,
                        cmsParagraph: updateNewStudentArticleCmsParagraphAction,
                        cmsLink: updateNewStudentArticleCmsLinkAction,
                    }
                }}
            />
        </PageWrapper>
    )
}

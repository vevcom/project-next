import { unwrapActionReturn } from '@/app/redirectToErrorPage'
import { readPublicArticle } from '@/services/publicArticles/actions'
import PublicArticle from '@/components/Cms/PublicArticle/PublicArticle'
import PageWrapper from '@/components/PageWrapper/PageWrapper'
import { publicArticleAuth } from '@/services/publicArticles/auth'
import { ServerSession } from '@/auth/session/ServerSession'

export default async function NewStudent() {
    const newStudentArticle = unwrapActionReturn(
        await readPublicArticle({ params: { special: 'NEW_STUDENT_PAGE' } })
    )

    const canEdit = publicArticleAuth.update.dynamicFields({}).auth(
        await ServerSession.fromNextAuth()
    ).toJsObject()

    return (
        <PageWrapper title="Ny student">
            <PublicArticle article={newStudentArticle} canEdit={canEdit} />
        </PageWrapper>
    )
}

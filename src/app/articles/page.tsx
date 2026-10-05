import styles from './page.module.scss'
import AddCategory from './AddCategory'
import { AddHeaderItemPopUp } from '@/components/HeaderItems/HeaderItemPopUp'
import ImageCard from '@/components/ImageCard/ImageCard'
import { readArticleCategoriesAction } from '@/services/articleCategories/actions'
import PageWrapper from '@/components/PageWrapper/PageWrapper'
import { articleCategoryAuth } from '@/services/articleCategories/auth'
import { ServerSession } from '@/auth/session/ServerSession'

export default async function ArticleCategoryList() {
    const res = await readArticleCategoriesAction()
    if (!res.success) throw new Error(res.error ? res.error[0].message : 'Noe uforutsett skjedde')

    const categories = res.data

    const session = await ServerSession.fromNextAuth()
    const canCreateArticleCategories = articleCategoryAuth.create.auth(session).authorized

    return (
        <PageWrapper title="Artikler" headerItem={
            canCreateArticleCategories && (
                <AddHeaderItemPopUp popUpKey="CreateCategory">
                    <AddCategory />
                </AddHeaderItemPopUp>
            )
        }>
            <main className={styles.wrapper}>
                {
                    categories.length ? (
                        categories.map((category) => (
                            <ImageCard
                                key={category.id}
                                title={category.name}
                                href={`/articles/${category.name}`}
                                image={category.coverImage}
                            >
                                {category.description}
                            </ImageCard>
                        ))
                    ) : (
                        <i>
                            Ingen kategorier å vise
                        </i>
                    )
                }
            </main>
        </PageWrapper>
    )
}

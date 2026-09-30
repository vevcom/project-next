import styles from './layout.module.scss'
import SideBar from './SideBar'
import PageTitleSetter from '@/contexts/PageTitleSetter'
import { articleCategoryOperations } from '@/services/articleCategories/operations'
import { withPageSession } from '@/app/serverPage'
import type { ReactNode } from 'react'

type PropTypes = {
    params: Promise<{
        category: string
    }>,
    children: ReactNode,
}

export default async function ArticleCategoryLayout({ params, children }: PropTypes) {
    const category = await withPageSession(async () => {
        const categoryName = decodeURIComponent((await params).category)
        return articleCategoryOperations.read({ params: { name: categoryName } })
    })

    return (
        <div className={styles.wrapper}>
            {/* These routes do not go through PageWrapper, so the nav's title has to be set here -
                in the layout, so it covers both the category page and the articles under it. */}
            <PageTitleSetter title={category.name} />
            <SideBar category={category}>
                {children}
            </SideBar>
        </div>
    )
}

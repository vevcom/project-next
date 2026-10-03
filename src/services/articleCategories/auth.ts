import { Require } from '@/auth/authorizer/Require'

export const articleCategoryAuth = {
    //This should probably be a permoission:
    create: Require.nothing(),
    //Article categories will be auth on visibility spesific to each category.
    destroy: Require.nothing(),
    update: Require.nothing(),
    updateArticle: Require.nothing(),
    readAll: Require.nothing(), //auth filter!!
    read: Require.nothing(),
    removeArticleFromCategory: Require.nothing(),
    addArticleToCategory: Require.nothing(),
    // visibility another vicibility table ....
    readArticleInCategory: Require.nothing(),
}

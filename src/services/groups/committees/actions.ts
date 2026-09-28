'use server'
import { makeAction } from '@/services/serverAction'
import { committeeOperations } from '@/services/groups/committees/operations'

export const createCommitteeAction = makeAction(committeeOperations.create)
export const readAllCommitteesAction = makeAction(committeeOperations.readAll)
export const readCommitteeAction = makeAction(committeeOperations.read)
export const readCommitteeArticleAction = makeAction(committeeOperations.readArticle)
export const readCommitteeParagraphAction = makeAction(committeeOperations.readParagraph)
export const readCommitteeMembersAction = makeAction(committeeOperations.readMembers)
export const readCommitteesExpandedAction = makeAction(committeeOperations.readExpanded)
export const addCommitteeMembersAction = makeAction(committeeOperations.addMembers)
export const removeCommitteeMembersAction = makeAction(committeeOperations.removeMembers)
export const setCommitteeMemberAdminAction = makeAction(committeeOperations.setMemberAdmin)
export const setCommitteeMemberTitleAction = makeAction(committeeOperations.setMemberTitle)
export const migrateCommitteeAction = makeAction(committeeOperations.migrateGroup)
export const updateCommitteeParagraphAction = makeAction(committeeOperations.updateParagraphContent)
export const destroyCommitteeAction = makeAction(committeeOperations.destroy)
export const updateCommitteeAction = makeAction(committeeOperations.update)

export const updateCommitteeLogoAction = makeAction(committeeOperations.updateLogo)

export const updateCommitteeArticleAction = makeAction(
    committeeOperations.updateArticle.update
)
export const updateCommitteeArticleAddSectionAction = makeAction(
    committeeOperations.updateArticle.addSection
)
export const updateCommitteeArticleReorderSectionsAction = makeAction(
    committeeOperations.updateArticle.reorderSections
)
export const updateCommitteeArticleCoverImageAction = makeAction(
    committeeOperations.updateArticle.coverImage
)
export const updateCommitteeArticleSectionAction = makeAction(
    committeeOperations.updateArticle.articleSections.update
)
export const updateCommitteeArticleSectionsAddPartAction = makeAction(
    committeeOperations.updateArticle.articleSections.addPart
)
export const updateCommitteeArticleSectionsRemovePartAction = makeAction(
    committeeOperations.updateArticle.articleSections.removePart
)
export const updateCommitteeArticleCmsImageAction = makeAction(
    committeeOperations.updateArticle.articleSections.cmsImage
)
export const updateCommitteeArticleCmsParagraphAction = makeAction(
    committeeOperations.updateArticle.articleSections.cmsParagraph
)
export const updateCommitteeArticleCmsLinkAction = makeAction(
    committeeOperations.updateArticle.articleSections.cmsLink
)

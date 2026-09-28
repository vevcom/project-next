import styles from './InterestGroup.module.scss'
import InterestGroupSettings from './InterestGroupSettings'
import ArticleSection from '@/components/Cms/ArticleSection/ArticleSection'
import {
    updateInterestGroupArticleSectionAction,
    addPartToInterestGroupArticleSectionAction,
    removePartFromInterestGroupArticleSectionAction,
    updateInterestGroupCmsImageAction,
    updateInterestGroupCmsParagraphAction,
    updateInterestGroupCmsLinkAction
} from '@/services/groups/interestGroups/actions'
import { interestGroupAuth } from '@/services/groups/interestGroups/auth'
import { configureAction } from '@/services/configureAction'
import { AuthResult } from '@/auth/authorizer/AuthResult'
import Link from 'next/link'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faGear } from '@fortawesome/free-solid-svg-icons'
import type { SessionMaybeUser } from '@/auth/session/Session'
import type { ExpandedInterestGroup } from '@/services/groups/interestGroups/types'

type PropTypes = {
    interestGroup: ExpandedInterestGroup
    session: SessionMaybeUser
}

export default function InterestGroup({ interestGroup, session }: PropTypes) {
    const canUpdate = interestGroupAuth.update.dynamicFields({ groupId: interestGroup.groupId }).auth(session)
    const canDestroy = interestGroupAuth.destroy.dynamicFields({}).auth(session)
    // A pensioned group's article is history too: the service refuses the write, so the editing
    // controls are not offered either.
    const canEditArticleSection = (interestGroup.pensioned
        ? new AuthResult(session, false, undefined, 'Gruppen er pensjonert')
        : interestGroupAuth.updateArticleSection.dynamicFields({ groupId: interestGroup.groupId }).auth(session)
    ).toJsObject()

    // The interest group's own page is where its members and migration are administered. The link
    // shows for anyone who may do one of those things - which includes the group's own admins, not
    // just holders of the interest group permission.
    const dynamicFields = { groupId: interestGroup.groupId }
    // Nothing about a pensioned group may be changed, so none of that is offered for one. Whoever
    // may pension it still needs the link though - bringing it back is reached from the same page.
    const canManage = !interestGroup.pensioned && [
        interestGroupAuth.addMembers,
        interestGroupAuth.removeMembers,
        interestGroupAuth.setMemberAdmin,
        interestGroupAuth.setMemberTitle,
        interestGroupAuth.migrateGroup,
    ].some(authorizer => authorizer.dynamicFields(dynamicFields).auth(session).authorized)
    const canPension = interestGroupAuth.pension.dynamicFields({}).auth(session).authorized
    const canAdministrate = canManage || canPension

    const cmsArticleActionConfig = { implementationParams: { interestGroupId: interestGroup.id } }

    return (
        <div className={styles.interestGroup}>
            <div className={styles.title}>
                <h2>{interestGroup.name}</h2>
                {interestGroup.pensioned && <span className={styles.pensioned}>Pensjonert</span>}
                {canAdministrate && (
                    <Link
                        className={styles.administrate}
                        href={`/interest-groups/${interestGroup.id}`}
                        aria-label={`Administrer ${interestGroup.name}`}
                    >
                        <FontAwesomeIcon icon={faGear} />
                    </Link>
                )}
                <InterestGroupSettings
                    interestGroupId={interestGroup.id}
                    interestGroupName={interestGroup.name}
                    canUpdate={canUpdate.toJsObject()}
                    canDestroy={canDestroy.toJsObject()}
                />
            </div>
            <ArticleSection
                canEdit={canEditArticleSection}
                key={interestGroup.id}
                articleSection={interestGroup.articleSection}
                actions={{
                    updateArticleSection: configureAction(
                        updateInterestGroupArticleSectionAction, cmsArticleActionConfig
                    ),
                    addPartToArticleSection: configureAction(
                        addPartToInterestGroupArticleSectionAction, cmsArticleActionConfig
                    ),
                    removePartFromArticleSection: configureAction(
                        removePartFromInterestGroupArticleSectionAction, cmsArticleActionConfig
                    ),
                    updateCmsImage: configureAction(
                        updateInterestGroupCmsImageAction, cmsArticleActionConfig
                    ),
                    updateCmsParagraph: configureAction(
                        updateInterestGroupCmsParagraphAction, cmsArticleActionConfig
                    ),
                    updateCmsLink: configureAction(
                        updateInterestGroupCmsLinkAction, cmsArticleActionConfig
                    ),
                }}
            />
        </div>
    )
}

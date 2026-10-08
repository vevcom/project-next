import styles from './School.module.scss'
import CmsLink from '@/cms/CmsLink/CmsLink'
import CmsImage from '@/cms/CmsImage/CmsImage'
import CmsParagraph from '@/cms/CmsParagraph/CmsParagraph'
import {
    updateSchoolCmsImageAction,
    updateSchoolCmsLinkAction,
    updateSchoolCmsParagraphContentAction
} from '@/services/education/schools/actions'
import { configureAction } from '@/services/configureAction'
import { schoolAuth } from '@/services/education/schools/auth'
import type { ExpandedSchool } from '@/services/education/schools/types'
import type{ SessionMaybeUser } from '@/auth/session/Session'

type PropTypes = {
    school: ExpandedSchool
    session: SessionMaybeUser
}

export default function School({ school, session }: PropTypes) {
    const updateCmsImageAction = configureAction(
        updateSchoolCmsImageAction,
        { implementationParams: { shortName: school.shortName } }
    )

    const canEditCmsImage = schoolAuth.updateCmsImage.auth(session)
    const canEditCmsParagraph = schoolAuth.updateCmsParagraphContent.auth(session)
    const canEditCmsLink = schoolAuth.updateCmsLink.auth(session)

    return (
        <div className={styles.School}>
            <CmsImage
                capabilities={{ canEdit: canEditCmsImage }}
                className={styles.cmsImage}
                classNameImage={styles.image}
                cmsImage={school.cmsImage}
                width={200}
                updateCmsImageAction={updateCmsImageAction}
            />

            <div className={styles.text}>
                <div className={styles.name}>
                    <h2>{school.name}</h2> <p>({school.shortName})</p>
                </div>
                <CmsParagraph
                    cmsParagraph={school.cmsParagraph}
                    updateCmsParagraphAction={
                        configureAction(
                            updateSchoolCmsParagraphContentAction,
                            { implementationParams: { shortName: school.shortName } }
                        )
                    }
                    capabilities={{ canEdit: canEditCmsParagraph }}
                />
                <CmsLink
                    cmsLink={school.cmsLink}
                    className={styles.cmsLink}
                    color="primary"
                    updateCmsLinkAction={
                        configureAction(
                            updateSchoolCmsLinkAction,
                            { implementationParams: { shortName: school.shortName } }
                        )
                    }
                    capabilities={{ canEdit: canEditCmsLink }}
                />
            </div>
        </div>
    )
}

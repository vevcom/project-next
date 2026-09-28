import styles from './page.module.scss'
import UserSettingsForm from './UserProfileSettingsForm'
import UserProfileSettingsCard from './UserProfileSettingsCard'
import ProfileImageUploader from './ProfileImageUploader'
import ChangeClassForm from './ChangeClassForm'
import ManageUserStudyProgrammes from './ManageUserStudyProgrammes'
import { getProfileForAdmin } from '@/app/users/[username]/(user-admin)/getProfileForAdmin'
import Image from '@/components/Image/Image'
import { readUserProfileAction, updateUserProfileImageAction } from '@/services/users/actions'
import { userAuth } from '@/services/users/auth'
import { classAuth } from '@/services/groups/classes/auth'
import { studyProgrammeAuth } from '@/services/groups/studyProgrammes/auth'
import { readStudyProgrammesAction } from '@/services/groups/studyProgrammes/actions'
import { unwrapActionReturn } from '@/app/redirectToErrorPage'
import { configureAction } from '@/services/configureAction'
import { notFound } from 'next/navigation'
import type { PropTypes } from '@/app/users/[username]/page'

export default async function UserSettings({ params }: PropTypes) {
    const { profile, session } = await getProfileForAdmin(await params, 'settings')
    const profileRes = await readUserProfileAction({ params: { username: (await params).username } })
    if (!profileRes.success) return notFound()
    const userDataFull = profileRes.data.user

    const canUpdateImage = userAuth.updateProfileImage.dynamicFields({
        username: profile.user.username
    }).auth(session).toJsObject()
    const canChangeClass = classAuth.changeClassOfUser.dynamicFields({}).auth(session).authorized
    // Study programme membership normally comes from Feide. Putting someone on one by hand is an
    // administrator's job, so the form only shows for one - the actions check per programme anyway.
    const canManageStudyProgrammes = studyProgrammeAuth.update.dynamicFields({}).auth(session).authorized
    const studyProgrammes = canManageStudyProgrammes
        ? unwrapActionReturn(await readStudyProgrammesAction())
        : []

    return (
        <div className={styles.wrapper}>
            <UserProfileSettingsCard>
                <UserSettingsForm user={userDataFull} />
            </UserProfileSettingsCard>
            {canChangeClass && (
                <UserProfileSettingsCard>
                    <ChangeClassForm
                        userId={userDataFull.id}
                        currentLevel={profileRes.data.class?.level ?? null}
                    />
                </UserProfileSettingsCard>
            )}
            {canManageStudyProgrammes && (
                <UserProfileSettingsCard>
                    <ManageUserStudyProgrammes
                        userId={userDataFull.id}
                        studyProgrammes={studyProgrammes}
                        memberOfGroupIds={profileRes.data.user.memberships
                            .filter(membership => membership.group.groupType === 'STUDY_PROGRAMME')
                            .filter(membership => membership.active)
                            .map(membership => membership.group.id)}
                    />
                </UserProfileSettingsCard>
            )}
            {/* TODO: add Email registration form and admin user settings */}
            <UserProfileSettingsCard>
                <h2>Generelle Instillinger</h2>
                <div className={styles.profileImage}>
                    <Image width={300} image={profile.user.image} />
                    <ProfileImageUploader
                        canEdit={canUpdateImage}
                        uploadImageAction={configureAction(
                            updateUserProfileImageAction,
                            { params: { username: profile.user.username } }
                        )}
                    />
                </div>
            </UserProfileSettingsCard>
        </div>
    )
}

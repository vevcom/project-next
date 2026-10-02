import styles from './page.module.scss'
import UserSettingsForm from './UserProfileSettingsForm'
import UserProfileSettingsCard from './UserProfileSettingsCard'
import ChangeEmailForm from './ChangeEmailForm'
import AdminUserSettingsForm from './AdminUserSettingsForm'
import ChangeClassForm from './ChangeClassForm'
import ManageUserStudyProgrammes from './ManageUserStudyProgrammes'
import { getProfileForUserPage } from '@/app/users/[username]/(user-pages)/getProfileForUserPage'
import Image from '@/components/Image/Image'
import CmsParagraphEditorForm from '@/components/Cms/CmsParagraph/CmsParagraphEditorForm'
import ImageUploader from '@/components/Image/ImageUploader'
import { updateUserBioParagraphContentAction, updateUserProfileImageAction } from '@/services/users/actions'
import { userAuth } from '@/services/users/auth'
import { classAuth } from '@/services/groups/classes/auth'
import { studyProgrammeAuth } from '@/services/groups/studyProgrammes/auth'
import { readStudyProgrammesAction } from '@/services/groups/studyProgrammes/actions'
import { unwrapActionReturn } from '@/app/redirectToErrorPage'
import { configureAction } from '@/services/configureAction'
import type { PropTypes } from '@/app/users/[username]/page'

/**
 * The first cards are what the user may change about themselves, which an administrator may change
 * for them as well. The rest is for administrators only.
 */
export default async function UserSettings({ params }: PropTypes) {
    const { profile, session } = await getProfileForUserPage(await params, 'settings')

    // Study programme membership normally comes from Feide. Putting someone on one by hand is an
    // administrator's job, so the form only shows for one - the actions check per programme anyway.
    const studyProgrammes = studyProgrammeAuth.update.dynamicFields({}).auth(session).authorized
        ? unwrapActionReturn(await readStudyProgrammesAction())
        : []

    return (
        <div className={styles.wrapper}>
            {userAuth.updateProfile.dynamicFields({ username: profile.user.username }).auth(session).authorized && (
                <UserProfileSettingsCard>
                    <UserSettingsForm user={profile.user} emailDomain={process.env.EMAIL_DOMAIN} />
                </UserProfileSettingsCard>
            )}
            {userAuth.updateBioParagraphContent.dynamicFields({ userId: profile.user.id }).auth(session).authorized && (
                <UserProfileSettingsCard>
                    <h2>Bio</h2>
                    <CmsParagraphEditorForm
                        cmsParagraph={profile.user.bioParagraph}
                        updateCmsParagraphAction={configureAction(
                            updateUserBioParagraphContentAction,
                            { implementationParams: { userId: profile.user.id } }
                        )}
                    />
                </UserProfileSettingsCard>
            )}
            {userAuth.registerNewEmail.dynamicFields({ userId: profile.user.id }).auth(session).authorized && (
                <UserProfileSettingsCard>
                    <ChangeEmailForm user={profile.user} />
                </UserProfileSettingsCard>
            )}
            {userAuth.updateProfileImage.dynamicFields({ username: profile.user.username }).auth(session).authorized && (
                <UserProfileSettingsCard>
                    <h2>Profilbilde</h2>
                    <div className={styles.profileImage}>
                        <Image width={300} image={profile.user.image} alt={profile.user.image.alt} />
                        <ImageUploader
                            title="Endre profilbilde"
                            uploadImageAction={configureAction(
                                updateUserProfileImageAction,
                                { params: { username: profile.user.username } }
                            )}
                            refreshOnSuccess
                        />
                    </div>
                </UserProfileSettingsCard>
            )}
            {userAuth.update.dynamicFields({}).auth(session).authorized && (
                <UserProfileSettingsCard>
                    <AdminUserSettingsForm user={profile.user} />
                </UserProfileSettingsCard>
            )}
            {classAuth.changeClassOfUser.dynamicFields({}).auth(session).authorized && (
                <UserProfileSettingsCard>
                    <ChangeClassForm
                        userId={profile.user.id}
                        currentLevel={profile.class?.level ?? null}
                    />
                </UserProfileSettingsCard>
            )}
            {studyProgrammeAuth.update.dynamicFields({}).auth(session).authorized && (
                <UserProfileSettingsCard>
                    <ManageUserStudyProgrammes
                        userId={profile.user.id}
                        studyProgrammes={studyProgrammes}
                        memberships={profile.groups.activeStudyProgrammes.map(({ groupId, order }) => ({
                            groupId,
                            order,
                        }))}
                    />
                </UserProfileSettingsCard>
            )}
        </div>
    )
}

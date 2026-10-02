import styles from './page.module.scss'
import Permission from '@/components/Permission/Permission'
import { getProfileForUserPage } from '@/app/users/[username]/(user-pages)/getProfileForUserPage'
import { readPermissionsOfUserAction } from '@/services/permissions/actions'
import { unwrapActionReturn } from '@/app/redirectToErrorPage'
import { v4 as uuid } from 'uuid'
import type { PropTypes } from '@/app/users/[username]/page'

export default async function UserSettings({ params }: PropTypes) {
    const { profile } = await getProfileForUserPage(await params, 'permissions')
    const permissions = unwrapActionReturn(
        await readPermissionsOfUserAction({ params: { userId: profile.user.id } })
    )

    return (
        <div className={styles.wrapper}>
            <h2>Tillganger:</h2>
            <ul>
                {permissions.map(permission =>
                    <Permission key={uuid()} permission={permission} className={styles.permission} />
                )}
            </ul>
        </div>
    )
}

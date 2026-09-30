import styles from './page.module.scss'
import Permission from '@/components/Permission/Permission'
import { getProfileForUserPage } from '@/app/users/[username]/(user-pages)/getProfileForUserPage'
import { serverPage } from '@/app/serverPage'
import { v4 as uuid } from 'uuid'
import type { PageOperationArgs } from '@/app/serverPage'

const { page, generateMetadata } = serverPage({
    operation: async ({ params, session }: PageOperationArgs<{ username: string }>) => {
        const { profile } = await getProfileForUserPage(params, 'permissions', session)
        return profile
    },
    render: ({ data: profile }) => (
        <div className={styles.wrapper}>
            <h2>Tillganger:</h2>
            <ul>
                {profile.permissions.map(permission =>
                    <Permission key={uuid()} permission={permission} className={styles.permission} />
                )}
            </ul>
            <h2>Grupper:</h2>
            <ul>
                {profile.memberships.map(membership => <li key={uuid()}>{membership.groupId}</li>)}
            </ul>
        </div>
    ),
})

export default page
export { generateMetadata }

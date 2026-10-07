import '@pn-server-only'

import { Html } from '@react-email/components'
import type { UserFiltered } from '@/services/users/types'

export function EmailChangedTemplate({
    user,
    newEmail,
}: {
    user: UserFiltered,
    newEmail: string,
}) {
    return (
        <Html>
            <p>Hei {user.firstname},</p>

            <p>
                E-posten til brukeren din ({user.username}) hos {process.env.WEBSITE_DOMAIN} er endret
                til {newEmail}. Glemt passord-e-poster går dit fra nå av.
            </p>

            <p>Var ikke dette deg? Ta kontakt med Vevcom med en gang.</p>

            <p>
                Med vennlig hilsen<br/>
                Vevcom
            </p>
        </Html>
    )
}

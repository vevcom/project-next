import '@pn-server-only'

import { Html } from '@react-email/components'
import type { UserFiltered } from '@/services/users/types'

export function DefaultEmailTemplate({
    html,
}: {
    user: UserFiltered,
    html: string,
}) {
    return (
        <Html>
            <div dangerouslySetInnerHTML={{ __html: html }} />

            <p style={{ color: '#666' }}>
                Du får denne e-posten siden du står på mailinglistene til Sct. Omega broderskab.
                Dersom du ønsker å avslutte abonommentet trykk <a href="https://www.youtube.com/watch?v=lYBUbBu4W08">her</a>.
            </p>
        </Html>
    )
}

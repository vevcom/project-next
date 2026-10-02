import '@pn-server-only'
import { DefaultEmailTemplate } from './templates/default'
import { markdownToSafeHtml } from '@/lib/html/safeHtml'
import { render } from '@react-email/render'
import type { UserFiltered } from '@/services/users/types'

export async function wrapInHTML(user: UserFiltered, text: string): Promise<string> {
    return render(<DefaultEmailTemplate user={user} html={await markdownToSafeHtml(text)} />)
}

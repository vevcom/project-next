import EmailRegistrationForm from './EmailregistrationForm'
import { ServerSession } from '@/auth/session/ServerSession'
import { Require } from '@/auth/authorizer/Require'
import { unwrapActionReturn } from '@/app/redirectToErrorPage'
import { readFeideLoginMatchAction } from '@/services/auth/actions'
import { readUserAction } from '@/services/users/actions'
import { notFound, redirect } from 'next/navigation'

export default async function Registeremail() {
    const { authorized, session } = Require.user().auth(await ServerSession.fromNextAuth())

    if (!authorized) notFound()

    const updatedUser = await readUserAction({ params: { id: session.user.id } })

    if (!updatedUser.success) {
        return notFound()
    }

    if (updatedUser.data.acceptedTerms) {
        redirect('/users/me')
    }

    if (updatedUser.data.emailVerified) {
        redirect('/register')
    }

    const feideLoginMatch = unwrapActionReturn(await readFeideLoginMatchAction())

    return <EmailRegistrationForm user={updatedUser.data} feideLoginMatch={feideLoginMatch} />
}

import RegistrationForm from './RegistrationForm'
import { QueryParams } from '@/lib/queryParams/queryParams'
import { userOperations } from '@/services/users/operations'
import { serverPage } from '@/app/serverPage'
import { notFound, redirect } from 'next/navigation'
import type { PageOperationArgs } from '@/app/serverPage'

const { page, generateMetadata } = serverPage({
    operation: async ({ searchParams, session }: PageOperationArgs) => {
        const callbackUrl = QueryParams.callbackUrl.decode(searchParams)
        if (!session.user) {
            return notFound()
        }
        const updatedUser = await userOperations.read({
            params: {
                id: session.user.id
            }
        })
        if (updatedUser.acceptedTerms) {
            redirect(callbackUrl ?? '/users/me')
        }
        if (!updatedUser.emailVerified) {
            const linkEnding = callbackUrl ? `?callbackUrl=${callbackUrl}` : ''
            redirect(`/register-email${linkEnding}`)
        }
        return updatedUser
    },
    render: ({ data: updatedUser }) => <RegistrationForm userData={updatedUser} />,
})

export default page
export { generateMetadata }

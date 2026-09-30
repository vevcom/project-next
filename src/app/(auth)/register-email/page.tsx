import EmailRegistrationForm from './EmailregistrationForm'
import { RequireUser } from '@/auth/authorizer/RequireUser'
import { userOperations } from '@/services/users/operations'
import { serverPage } from '@/app/serverPage'
import { notFound, redirect } from 'next/navigation'
import type { PageOperationArgs } from '@/app/serverPage'

const { page, generateMetadata } = serverPage({
    operation: async ({ session }: PageOperationArgs) => {
        const authResult = RequireUser.staticFields({}).dynamicFields({}).auth(session)
        if (!authResult.authorized) return notFound()

        const updatedUser = await userOperations.read({ params: { id: authResult.session.user.id } })

        if (updatedUser.acceptedTerms) {
            redirect('/users/me')
        }

        if (updatedUser.emailVerified) {
            redirect('/register')
        }

        return updatedUser
    },
    render: ({ data: updatedUser }) => <EmailRegistrationForm user={updatedUser} />,
})

export default page
export { generateMetadata }

import OmegaId from '@/components/OmegaId/identification/OmegaId'
import { serverPage } from '@/app/serverPage'
import { forbidden, notFound, redirect } from 'next/navigation'
import type { PageOperationArgs } from '@/app/serverPage'

const { page, generateMetadata } = serverPage({
    operation: async ({ params, session }: PageOperationArgs<{ username: string }>) => {
        if (!session.user) notFound()

        if (params.username === 'me') {
            redirect(`/users/${session.user.username}/omegaid`)
        }

        if (params.username !== session.user.username) {
            forbidden()
        }
    },
    metadata: () => ({ title: 'OmegaId' }),
    render: () => (
        <div className={[
            'bg-surface-base h-full w-full flex justify-center items-center m-auto p-[1rem]',
            '[&>div]:max-w-[20rem]! [&>div]:w-[calc(100vw-2rem)]!',
        ].join(' ')}>
            <OmegaId />
        </div>
    ),
})

export default page
export { generateMetadata }

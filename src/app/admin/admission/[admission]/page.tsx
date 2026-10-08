import RegisterAdmissiontrial from './registration'
import { admissionDisplayNames, allAdmissions } from '@/services/admission/constants'
import PageWrapper from '@/components/PageWrapper/PageWrapper'
import { UserPagingProvider } from '@/contexts/paging/UserPaging'
import { omegaIdOperations } from '@/services/omegaid/operations'
import { serverPage } from '@/app/serverPage'
import { userAuth } from '@/services/users/auth'
import { notFound } from 'next/navigation'
import type { PageOperationArgs } from '@/app/serverPage'
import type { Admission as AdmissionType } from '@/prisma-generated-pn-types'

const { page, generateMetadata } = serverPage({
    operation: async ({ params }: PageOperationArgs<{ admission: AdmissionType }>) => {
        if (!allAdmissions.includes(params.admission)) {
            notFound()
        }

        const publicKey = await omegaIdOperations.readPublicKey({})
        return { admission: params.admission, publicKey }
    },
    capabilities: () => ({
        canSearchUsers: userAuth.readPage,
    }),
    metadata: (data) => ({ title: `Registrer opptak for ${admissionDisplayNames[data.admission]}` }),
    render: ({ data, capabilities }) => (
        <PageWrapper>
            <UserPagingProvider
                startPage={{ page: 0, pageSize: 50 }}
                serverRenderedData={[]}
                details={{ partOfName: '', groups: [] }}
            >
                <RegisterAdmissiontrial
                    admission={data.admission}
                    omegaIdPublicKey={data.publicKey}
                    canSearchUsers={capabilities.canSearchUsers.authorized}
                />
            </UserPagingProvider>
        </PageWrapper>
    ),
})

export default page
export { generateMetadata }

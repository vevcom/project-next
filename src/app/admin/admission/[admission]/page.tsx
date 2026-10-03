import RegisterAdmissiontrial from './registration'
import { admissionDisplayNames, allAdmissions } from '@/services/admission/constants'
import PageWrapper from '@/components/PageWrapper/PageWrapper'
import { UserPagingProvider } from '@/contexts/paging/UserPaging'
import { readOmegaJWTPublicKeyAction } from '@/services/omegaid/actions'
import { unwrapActionReturn } from '@/app/redirectToErrorPage'
import { ServerSession } from '@/auth/session/ServerSession'
import { userAuth } from '@/services/users/auth'
import { type Admission as AdmissionType } from '@/prisma-generated-pn-types'
import { notFound } from 'next/navigation'

type PropTypes = {
    params: Promise<{
        admission: AdmissionType
    }>
}

export default async function AdmissionTrials({ params }: PropTypes) {
    if (!allAdmissions.includes((await params).admission)) {
        notFound()
    }

    const admission = (await params).admission

    const publicKey = unwrapActionReturn(await readOmegaJWTPublicKeyAction())

    const session = await ServerSession.fromNextAuth()
    const canSearchUsers = userAuth.readPage.auth(session).authorized

    return <PageWrapper
        title={`Registrer opptak for ${admissionDisplayNames[admission]}`}
    >
        <UserPagingProvider
            startPage={{ page: 0, pageSize: 50 }}
            serverRenderedData={[]}
            details={{ partOfName: '', groups: [] }}
        >
            <RegisterAdmissiontrial
                admission={admission}
                omegaIdPublicKey={publicKey}
                canSearchUsers={canSearchUsers}
            />
        </UserPagingProvider>
    </PageWrapper>
}

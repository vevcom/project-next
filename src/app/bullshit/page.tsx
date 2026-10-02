import BullshitList from './BullshitList'
import BullshitBullshit from './BullshitBullshit'
import BullshitForm from './CreateBullshitForm'
import { BullshitPagingProvider } from '@/contexts/paging/BullshitPaging'
import PageWrapper from '@/components/PageWrapper/PageWrapper'
import { readBullshitPageAction } from '@/services/bullshit/actions'
import { ServerSession } from '@/auth/session/ServerSession'
import { bullshitAuth } from '@/services/bullshit/auth'
import { notFound } from 'next/navigation'
import { v4 as uuid } from 'uuid'
import type { PageSizeBullshit } from '@/contexts/paging/BullshitPaging'
export default async function Bullshit() {
    const session = await ServerSession.fromNextAuth()
    const showCreateButton = session.user && bullshitAuth.create.dynamicFields({}).auth(session).authorized || false

    const showBullshit = session.user && bullshitAuth.readPage.dynamicFields({}).auth(session).authorized || false

    const pageSize: PageSizeBullshit = 20

    if (showBullshit) {
        const readBullshit = await readBullshitPageAction({
            params: {
                paging: {
                    page: {
                        pageSize,
                        page: 0,
                        cursor: null,
                    },
                    details: undefined
                }
            }
        })
        if (!readBullshit.success) notFound()
        const bullshits = readBullshit.data
        return (
            <PageWrapper title="Bullshit" headerItem={
                showCreateButton && <BullshitForm />
            }>
                <BullshitPagingProvider
                    startPage={{
                        pageSize,
                        page: 1,
                    }}
                    details={undefined}
                    serverRenderedData={bullshits}
                >
                    <main>
                        <BullshitList
                            serverRendered={bullshits.map(bullshit => <BullshitBullshit key={uuid()} quote={bullshit} />)}
                        />
                    </main>
                </BullshitPagingProvider>
            </PageWrapper>
        )
    }
    return (
        <PageWrapper title="Bullshit" headerItem={
            showCreateButton && <BullshitForm />
        }>
            <></>
        </PageWrapper>
    )
}

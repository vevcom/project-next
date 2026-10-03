import OmegaquoteList from './OmegaquotesQuoteList'
import OmegaquoteQuote from './OmegaquotesQuote'
import CreateOmegaquoteForm from './CreateOmegaquoteForm'
import { OmegaquotePagingProvider } from '@/contexts/paging/OmegaquotesPaging'
import PageWrapper from '@/components/PageWrapper/PageWrapper'
import { readQuotesPageAction } from '@/services/omegaquotes/actions'
import { ServerSession } from '@/auth/session/ServerSession'
import { omegaQuotesAuth } from '@/services/omegaquotes/auth'
import { notFound } from 'next/navigation'
import { v4 as uuid } from 'uuid'
import type { PageSizeOmegaquote } from '@/contexts/paging/OmegaquotesPaging'

export default async function OmegaQuotes() {
    const session = await ServerSession.fromNextAuth()
    const showCreateButton = session.user &&
        omegaQuotesAuth.create.data({ userId: session.user.id }).auth(session).authorized || false

    const pageSize: PageSizeOmegaquote = 20

    const readQuotes = await readQuotesPageAction({
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
    if (!readQuotes.success) notFound()
    const quotes = readQuotes.data

    return (
        <PageWrapper title="Omegaquotes" headerItem={
            showCreateButton && <CreateOmegaquoteForm/>
        }>
            <OmegaquotePagingProvider
                startPage={{
                    pageSize,
                    page: 1,
                }}
                details={undefined}
                serverRenderedData={quotes}
            >
                <main>
                    <OmegaquoteList
                        serverRendered={quotes.map(quote => <OmegaquoteQuote key={uuid()} quote={quote}/>)}
                    />
                </main>
            </OmegaquotePagingProvider>
        </PageWrapper>
    )
}

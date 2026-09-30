import OmegaquoteList from './OmegaquotesQuoteList'
import OmegaquoteQuote from './OmegaquotesQuote'
import CreateOmegaquoteForm from './CreateOmegaquoteForm'
import { OmegaquotePagingProvider } from '@/contexts/paging/OmegaquotesPaging'
import PageWrapper from '@/components/PageWrapper/PageWrapper'
import { omegaquoteOperations } from '@/services/omegaquotes/operations'
import { omegaQuotesAuth } from '@/services/omegaquotes/auth'
import { serverPage } from '@/app/serverPage'
import { v4 as uuid } from 'uuid'
import type { PageSizeOmegaquote } from '@/contexts/paging/OmegaquotesPaging'

const pageSize: PageSizeOmegaquote = 20

const { page, generateMetadata } = serverPage({
    operation: async () => omegaquoteOperations.readPage({
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
    }),
    metadata: () => ({ title: 'Omegaquotes' }),
    render: ({ data: quotes, session }) => {
        // The create authorizer needs the session's own user id, so it is run inline here rather
        // than declared as an authChecker.
        const showCreateButton = session.user && omegaQuotesAuth.create.dynamicFields({
            userId: session.user.id
        }).auth(session).authorized || false

        return (
            <PageWrapper headerItem={
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
    },
})

export default page
export { generateMetadata }

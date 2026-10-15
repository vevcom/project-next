import getCommittee from './getCommittee'
import Nav from './Nav'
import PageTitleSetter from '@/contexts/PageTitleSetter'
import PageWrapper from '@/components/PageWrapper/PageWrapper'
import CommitteeImage from '@/components/Committee/CommitteeImage/CommitteeImage'
import { committeeAuth } from '@/services/groups/committees/auth'
import { serverLayout } from '@/app/serverPage'
import { Require } from '@/auth/authorizer/Require'
import type { LayoutOperationArgs } from '@/app/serverPage'

export default serverLayout({
    operation: async ({ params }: LayoutOperationArgs<{ shortName: string }>) => ({
        committee: await getCommittee(params.shortName),
        shortNameParam: params.shortName,
    }),
    capabilities: ({ committee }) => ({
        // A pensioned committee is history: the service refuses every change to it, so the
        // editing controls are not offered on any of its pages either.
        canEditCoverImage: Require.allOf(
            committeeAuth.updateArticle.data({ groupId: committee.groupId }),
            Require.custom(() => !committee.pensioned, { errorMessage: 'Komiteen er pensjonert' }),
        ),
    }),
    render: ({ data: { committee, shortNameParam }, capabilities, children }) => (
        <div className="grid grid-rows-[1fr_auto] h-full min-h-0">
            <div className="min-h-0 rounded-round mb-2 overflow-y-scroll">
                <CommitteeImage
                    capabilities={capabilities}
                    shortName={committee.shortName}
                    logoImage={committee.logoImage}
                    coverImage={committee.coverImage}
                />
                <PageWrapper className="rounded-round">
                    <PageTitleSetter title={committee.name} />
                    {committee.pensioned && (
                        <p className="py-2 px-4 mb-4 rounded-round border border-text-muted text-text-muted">
                            Denne komiteen er pensjonert. Den har ingen aktive medlemmer, og
                            innholdet står som det var.
                        </p>
                    )}
                    { children }
                </PageWrapper>
            </div>
            <Nav shortName={shortNameParam} groupId={committee.groupId} />
        </div>
    ),
})

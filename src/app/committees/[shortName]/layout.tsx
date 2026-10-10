import getCommittee from './getCommittee'
import Nav from './Nav'
import styles from './layout.module.scss'
import PageTitleSetter from '@/contexts/PageTitleSetter'
import PageWrapper from '@/components/PageWrapper/PageWrapper'
import CommitteeImage from '@/components/Committee/CommitteeImage/CommitteeImage'
import { committeeAuth } from '@/services/groups/committees/auth'
import { serverLayout } from '@/app/serverPage'
import { AuthResult } from '@/auth/authorizer/AuthResult'
import { committeeParticipationAuth } from '@/services/applications/committeeParticipation/auth'
import type { LayoutOperationArgs } from '@/app/serverPage'

export default serverLayout({
    operation: async ({ params, session }: LayoutOperationArgs<{ shortName: string }>) => {
        const committee = await getCommittee(params.shortName)

        return {
            committee,
            shortNameParam: params.shortName,
            // A pensioned committee is history: the service refuses every change to it, so the
            // editing controls are not offered on any of its pages either.
            canEditCoverImage: (committee.pensioned
                ? new AuthResult(session, false, undefined, 'Komiteen er pensjonert')
                : committeeAuth.updateArticle.data({ groupId: committee.groupId }).auth(session)
            ).toJsObject(),
            canReadCommitteeApplication: committeeParticipationAuth.readAll.data({
                groupId: committee.groupId,
            }).auth(session).toJsObject(),
        }
    },
    render: ({ data: { committee, shortNameParam, canEditCoverImage, canReadCommitteeApplication }, children }) => (
        <div className={styles.pageLayout}>
            <div className={styles.main}>
                <CommitteeImage
                    canEditCoverImage={canEditCoverImage}
                    shortName={committee.shortName}
                    logoImage={committee.logoImage}
                    coverImage={committee.coverImage}
                />
                <PageWrapper className={styles.pageWrapper}>
                    <PageTitleSetter title={committee.name} />
                    {committee.pensioned && (
                        <p className={styles.pensioned}>
                            Denne komiteen er pensjonert. Den har ingen aktive medlemmer, og
                            innholdet står som det var.
                        </p>
                    )}
                    { children }
                </PageWrapper>
            </div>
            <Nav
                shortName={shortNameParam}
                canReadCommitteeApplication={canReadCommitteeApplication}
            />
        </div>
    ),
})

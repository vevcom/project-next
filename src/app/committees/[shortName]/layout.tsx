import getCommitee from './getCommittee'
import Nav from './Nav'
import styles from './layout.module.scss'
import PageTitleSetter from '@/contexts/PageTitleSetter'
import PageWrapper from '@/components/PageWrapper/PageWrapper'
import CommitteeImage from '@/components/Committee/CommitteeImage/CommitteeImage'
import { committeeAuth } from '@/services/groups/committees/auth'
import { withPageSession } from '@/app/serverPage'
import { AuthResult } from '@/auth/authorizer/AuthResult'
import { committeeParticipationAuth } from '@/services/applications/committeeParticipation/auth'
import type { ReactNode } from 'react'

export type PropTypes = {
    params: Promise<{
        shortName: string
    }>,
    children: ReactNode
}

export default async function Committee({ params, children }: PropTypes) {
    const { committee, canEditCoverImage, canReadCommitteeApplication } = await withPageSession(async (session) => {
        const committeeOfPage = await getCommitee((await params).shortName)

        return {
            committee: committeeOfPage,
            // A pensioned committee is history: the service refuses every change to it, so the
            // editing controls are not offered on any of its pages either.
            canEditCoverImage: (committeeOfPage.pensioned
                ? new AuthResult(session, false, undefined, 'Komiteen er pensjonert')
                : committeeAuth.updateArticle.dynamicFields({ groupId: committeeOfPage.groupId }).auth(session)
            ).toJsObject(),
            canReadCommitteeApplication: committeeParticipationAuth.readAll.dynamicFields({
                groupId: committeeOfPage.groupId,
            }).auth(session).toJsObject(),
        }
    })

    return (
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
                shortName={(await params).shortName}
                canReadCommitteeApplication={canReadCommitteeApplication}
            />
        </div>
    )
}

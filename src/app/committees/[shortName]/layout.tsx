import getCommitee from './getCommittee'
import Nav from './Nav'
import styles from './layout.module.scss'
import PageWrapper from '@/components/PageWrapper/PageWrapper'
import CommitteeImage from '@/components/Committee/CommitteeImage/CommitteeImage'
import { committeeAuth } from '@/services/groups/committees/auth'
import { ServerSession } from '@/auth/session/ServerSession'
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
    const committee = await getCommitee(params)

    const committeeLogo = committee.logoImage

    // A pensioned committee is history: the service refuses every change to it, so the editing
    // controls are not offered on any of its pages either.
    const canEditCoverImage = (committee.pensioned
        ? new AuthResult(await ServerSession.fromNextAuth(), false, undefined, 'Komiteen er pensjonert')
        : committeeAuth.updateArticle.data({ groupId: committee.groupId }).auth(
            await ServerSession.fromNextAuth()
        )
    ).toJsObject()

    const canReadCommitteeApplication = committeeParticipationAuth.readAll.data({ groupId: committee.groupId }).auth(
        await ServerSession.fromNextAuth()
    ).toJsObject()


    return (
        <div className={styles.pageLayout}>
            <div className={styles.main}>
                <CommitteeImage
                    canEditCoverImage={canEditCoverImage}
                    shortName={committee.shortName}
                    logoImage={committeeLogo}
                    coverImage={committee.coverImage}
                />
                <PageWrapper className={styles.pageWrapper} title={committee.name}>
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

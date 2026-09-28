import styles from './page.module.scss'
import getCommittee from './getCommittee'
import {
    readCommitteeMembersAction,
    readCommitteeParagraphAction,
    updateCommitteeParagraphAction
} from '@/services/groups/committees/actions'
import { unwrapActionReturn } from '@/app/redirectToErrorPage'
import CmsParagraph from '@/components/Cms/CmsParagraph/CmsParagraph'
import UserCard from '@/components/User/UserCard'
import { configureAction } from '@/services/configureAction'
import { committeeAuth } from '@/services/groups/committees/auth'
import { ServerSession } from '@/auth/session/ServerSession'

export type PropTypes = {
    params: Promise<{
        shortName: string
    }>
}

export default async function Committee({ params }: PropTypes) {
    const committee = await getCommittee(params)
    const paragraphRes = await readCommitteeParagraphAction({ params: await params })
    if (!paragraphRes.success) throw new Error('Kunne ikke hente komitéparagrafen')
    const members = unwrapActionReturn(await readCommitteeMembersAction({
        params: {
            groupId: committee.groupId,
            active: true,
        },
    }))

    const paragraph = paragraphRes.data

    const canEditCommitteeParagraph = committeeAuth.updateParagraphContent.dynamicFields({
        groupId: committee.groupId
    }).auth(await ServerSession.fromNextAuth()).toJsObject()

    return (
        <div className={styles.wrapper}>
            <CmsParagraph
                canEdit={canEditCommitteeParagraph}
                cmsParagraph={paragraph}
                updateCmsParagraphAction={configureAction(
                    updateCommitteeParagraphAction,
                    { implementationParams: { shortName: (await params).shortName } }
                )}
            />

            <h2>Komitémedlemmer</h2>
            <div className={styles.memberList}>
                {members.map((member, i) => <UserCard
                    key={i}
                    user={member.user}
                    subText={member.title}
                />)}
            </div>
        </div>
    )
}

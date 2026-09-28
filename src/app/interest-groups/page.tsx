import styles from './page.module.scss'
import CreateInterestGroupForm from './CreateInterestGroupForm'
import InterestGroup from './InterestGroup'
import SpecialCmsParagraph from '@/cms/CmsParagraph/SpecialCmsParagraph'
import PageWrapper from '@/components/PageWrapper/PageWrapper'
import { unwrapActionReturn } from '@/app/redirectToErrorPage'
import { AddHeaderItemPopUp } from '@/components/HeaderItems/HeaderItemPopUp'
import { interestGroupAuth } from '@/services/groups/interestGroups/auth'
import {
    readInterestGroupsAction,
    readSpecialCmsParagraphGeneralInfoAction,
    updateSpecialCmsParagraphContentGeneralInfoAction
} from '@/services/groups/interestGroups/actions'
import { ServerSession } from '@/auth/session/ServerSession'

export default async function InterestGroups() {
    const interestGroups = unwrapActionReturn(await readInterestGroupsAction())

    const session = await ServerSession.fromNextAuth()
    const canCreate = interestGroupAuth.create.dynamicFields({}).auth(session)
    const canEditGeneralInfo = interestGroupAuth.updateSpecialCmsParagraphContentGeneralInfo.dynamicFields(
        {}
    ).auth(
        session
    ).toJsObject()

    return (
        <PageWrapper transparent title="Interessegrupper">
            <div className={styles.content}>
                <div className={styles.generalInfo}>
                    {canCreate.authorized && (
                        <AddHeaderItemPopUp popUpKey="Create interest group">
                            <CreateInterestGroupForm/>
                        </AddHeaderItemPopUp>
                    )}
                    <SpecialCmsParagraph
                        canEdit={canEditGeneralInfo}
                        special="INTEREST_GROUP_GENERAL_INFO"
                        readSpecialCmsParagraphAction={readSpecialCmsParagraphGeneralInfoAction}
                        updateCmsParagraphAction={updateSpecialCmsParagraphContentGeneralInfoAction}
                    />
                </div>
                <main className={styles.islands}>
                    {
                        // Pensioned groups are part of the history rather than something to join, so
                        // they are listed after the ones that still run.
                        [...interestGroups]
                            .sort((one, two) => Number(one.pensioned) - Number(two.pensioned))
                            .map(interestGroup => (
                                <InterestGroup
                                    session={session}
                                    key={interestGroup.id}
                                    interestGroup={interestGroup}
                                />
                            ))
                    }
                </main>
            </div>
        </PageWrapper>
    )
}

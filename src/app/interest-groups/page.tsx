import styles from './page.module.scss'
import CreateInterestGroupForm from './CreateInterestGroupForm'
import InterestGroup from './InterestGroup'
import SpecialCmsParagraph from '@/cms/CmsParagraph/SpecialCmsParagraph'
import PageWrapper from '@/components/PageWrapper/PageWrapper'
import { AddHeaderItemPopUp } from '@/components/HeaderItems/HeaderItemPopUp'
import { interestGroupAuth } from '@/services/groups/interestGroups/auth'
import {
    readSpecialCmsParagraphGeneralInfoAction,
    updateSpecialCmsParagraphContentGeneralInfoAction
} from '@/services/groups/interestGroups/actions'
import { interestGroupOperations } from '@/services/groups/interestGroups/operations'
import { serverPage } from '@/app/serverPage'

const { page, generateMetadata } = serverPage({
    operation: async () => interestGroupOperations.readMany({}),
    capabilityChecks: {
        canCreate: () => interestGroupAuth.create,
        canEditGeneralInfo: () => interestGroupAuth.updateSpecialCmsParagraphContentGeneralInfo,
    },
    metadata: () => ({ title: 'Interessegrupper' }),
    render: ({ data: interestGroups, capabilities, session }) => (
        <PageWrapper transparent>
            <div className={styles.content}>
                <div className={styles.generalInfo}>
                    {capabilities.canCreate.authorized && (
                        <AddHeaderItemPopUp popUpKey="Create interest group">
                            <CreateInterestGroupForm/>
                        </AddHeaderItemPopUp>
                    )}
                    <SpecialCmsParagraph
                        canEdit={capabilities.canEditGeneralInfo.toJsObject()}
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
    ),
})

export default page
export { generateMetadata }

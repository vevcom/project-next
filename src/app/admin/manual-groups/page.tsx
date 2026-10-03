import styles from './page.module.scss'
import ManualGroupForm from './ManualGroupForm'
import DestroyManualGroup from './DestroyManualGroup'
import { readManualGroupsAction, readManualGroupsExpandedAction } from '@/services/groups/manualGroups/actions'
import { readCurrentOmegaOrderAction } from '@/services/omegaOrder/actions'
import { manualGroupAuth } from '@/services/groups/manualGroups/auth'
import { unwrapActionReturn } from '@/app/redirectToErrorPage'
import PageWrapper from '@/components/PageWrapper/PageWrapper'
import PopUp from '@/components/PopUp/PopUp'
import { AddHeaderItemPopUp } from '@/components/HeaderItems/HeaderItemPopUp'
import { authorizeAdminPage } from '@/app/admin/authorizeAdminPage'
import Link from 'next/link'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPencil } from '@fortawesome/free-solid-svg-icons'

export default async function ManualGroups() {
    const session = await authorizeAdminPage('manual-groups')

    const [manualGroups, expandedGroups, currentOrder] = await Promise.all([
        readManualGroupsAction().then(unwrapActionReturn),
        readManualGroupsExpandedAction().then(unwrapActionReturn),
        readCurrentOmegaOrderAction().then(unwrapActionReturn),
    ])

    const canAdmin = manualGroupAuth.update.auth(session).authorized

    const membersOfGroup = (groupId: number) =>
        expandedGroups.find(group => group.id === groupId)?.members ?? 0
    const orderOfGroup = (groupId: number) =>
        expandedGroups.find(group => group.id === groupId)?.order ?? currentOrder.order

    return (
        <PageWrapper
            title="Andre grupper"
            headerItem={canAdmin && (
                <AddHeaderItemPopUp popUpKey="create manual group">
                    <ManualGroupForm />
                </AddHeaderItemPopUp>
            )}
        >
            <p className={styles.explanation}>
                Øvrige grupper som ikke passer inn i de andre gruppetypene. De migreres én og én: når
                Omega inkrementeres blir de stående i forrige orden til noen velger hvilke medlemmer
                som skal videre.
            </p>
            <table className={styles.groupList}>
                <thead>
                    <tr>
                        {canAdmin && <th>Rediger</th>}
                        <th>Navn</th>
                        <th>Kortnavn</th>
                        <th>Orden</th>
                        <th>Aktive medlemmer</th>
                        <th>Status</th>
                        {canAdmin && <th></th>}
                    </tr>
                </thead>
                <tbody>
                    {/* Pensioned groups are done with - they belong under the ones still running. */}
                    {[...manualGroups]
                        .sort((one, two) => Number(one.pensioned) - Number(two.pensioned))
                        .map(manualGroup => (
                            <tr key={manualGroup.id}>
                                {canAdmin && (
                                    <td className={styles.editCell}>
                                        <PopUp
                                            showButtonContent={<FontAwesomeIcon icon={faPencil} />}
                                            showButtonClass={styles.editButton}
                                            popUpKey={`update manual group ${manualGroup.id}`}
                                        >
                                            <ManualGroupForm manualGroup={manualGroup} />
                                        </PopUp>
                                    </td>
                                )}
                                <th>
                                    <Link href={`/admin/manual-groups/${manualGroup.id}`}>
                                        {manualGroup.name}
                                    </Link>
                                </th>
                                <td>{manualGroup.shortName}</td>
                                <td>{orderOfGroup(manualGroup.groupId)}</td>
                                <td>{membersOfGroup(manualGroup.groupId)}</td>
                                <td>{manualGroup.pensioned ? 'Pensjonert' : 'Aktiv'}</td>
                                {canAdmin && (
                                    <td className={styles.rowActions}>
                                        <DestroyManualGroup id={manualGroup.id} name={manualGroup.name} />
                                    </td>
                                )}
                            </tr>
                        ))}
                </tbody>
            </table>
        </PageWrapper>
    )
}

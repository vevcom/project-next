'use client'
import styles from './ManageGroupMembers.module.scss'
import Form from '@/components/Form/Form'
import PopUp from '@/components/PopUp/PopUp'
import TextInput from '@/components/UI/TextInput'
import { SelectNumber } from '@/components/UI/Select'
import UserList from '@/components/User/UserList/UserList'
import UsersSelectionProvider, { UsersSelectionContext } from '@/contexts/UsersSelection'
import { UserPagingProvider } from '@/contexts/paging/UserPaging'
import { useRouter } from 'next/navigation'
import { useContext, useState } from 'react'
import type {
    AddGroupMembersAction,
    RemoveGroupMembersAction,
    SetGroupMemberAdminAction,
    SetGroupMemberTitleAction,
} from '@/services/groups/types'
import type { PopUpKeyType } from '@/contexts/PopUp'

export type ManageGroupMembersMember = {
    userId: number,
    name: string,
    title: string,
    admin: boolean,
    active: boolean,
}

export type ManageGroupMembersOrder = {
    order: number,
    members: ManageGroupMembersMember[],
}

type PropTypes = {
    groupId: number,
    /**
     * The order the group itself stands in. It is what the UI opens on, and the only order whose
     * memberships are the group's current ones - the rest are history.
     */
    groupOrder: number,
    /**
     * The group's memberships grouped by the order they belong to. Every order the group has
     * memberships in should be here, including `groupOrder` even when it has none yet.
     */
    orders: ManageGroupMembersOrder[],
    /**
     * The member management actions of the group type in question. Every group type that implements
     * simple member management exposes the same shapes, which is what this component is written
     * against. Leave one out and that part of the UI is not offered.
     */
    addMembersAction?: AddGroupMembersAction,
    removeMembersAction?: RemoveGroupMembersAction,
    setMemberAdminAction?: SetGroupMemberAdminAction,
    setMemberTitleAction?: SetGroupMemberTitleAction,
}

/**
 * Picks users out of the user list and adds them to the group at the order being managed.
 *
 * Removing deactivates the membership rather than deleting it, so the group's history of the order
 * stays intact - which is why a removed member goes inactive here rather than disappearing.
 *
 * Adding to an order below the group's own gives an inactive membership, since a group migrated by
 * hand holds no active memberships below its own order. Every group type that exposes these actions
 * today is migrated by hand; the note about it would need revisiting if that changed.
 */
function AddMembers({ groupId, order, addMembersAction, popUpKey }: {
    groupId: number,
    order: number,
    addMembersAction: AddGroupMembersAction,
    popUpKey: PopUpKeyType,
}) {
    const { refresh } = useRouter()
    const selection = useContext(UsersSelectionContext)
    const selectedUsers = selection?.users ?? []

    return (
        <div className={styles.addPanel}>
            {selectedUsers.length > 0 && (
                <Form
                    submitText={`Legg til ${selectedUsers.length} bruker(e) i orden ${order}`}
                    action={() => addMembersAction(
                        { params: { groupId, order } },
                        {
                            data: {
                                users: selectedUsers.map(user => ({ userId: user.id, admin: false })),
                            },
                        }
                    )}
                    successCallback={refresh}
                    closePopUpOnSuccess={popUpKey}
                />
            )}
            <UserList />
        </div>
    )
}

export default function ManageGroupMembers({
    groupId,
    groupOrder,
    orders,
    addMembersAction,
    removeMembersAction,
    setMemberAdminAction,
    setMemberTitleAction,
}: PropTypes) {
    const { refresh } = useRouter()
    const [selectedOrder, setSelectedOrder] = useState(groupOrder)
    const addPopUpKey: PopUpKeyType = `Add members to group ${groupId} order ${selectedOrder}`

    const members = orders.find(order => order.order === selectedOrder)?.members ?? []

    return (
        <div className={styles.ManageGroupMembers}>
            <div className={styles.orderPicker}>
                <SelectNumber
                    name={`order-of-group-${groupId}`}
                    label="Orden"
                    value={selectedOrder}
                    onChange={setSelectedOrder}
                    options={orders.map(order => ({
                        value: order.order,
                        label: order.order === groupOrder
                            ? `${order.order} (gruppens orden)`
                            : `${order.order}`,
                        key: `${order.order}`,
                    }))}
                />
                {selectedOrder !== groupOrder && (
                    <p className={styles.historyNote}>
                        Orden {selectedOrder} er historikk - gruppen selv står i orden {groupOrder}.
                        Medlemmer som legges til her blir lagt til som inaktive medlemskap.
                    </p>
                )}
            </div>

            {addMembersAction && (
                <PopUp
                    key={selectedOrder}
                    popUpKey={addPopUpKey}
                    showButtonClass={styles.addButton}
                    showButtonContent={<>Legg til medlemmer</>}
                >
                    <UserPagingProvider
                        serverRenderedData={[]}
                        startPage={{ page: 0, pageSize: 50 }}
                        details={{ groups: [], partOfName: '' }}
                    >
                        <UsersSelectionProvider>
                            <AddMembers
                                groupId={groupId}
                                order={selectedOrder}
                                addMembersAction={addMembersAction}
                                popUpKey={addPopUpKey}
                            />
                        </UsersSelectionProvider>
                    </UserPagingProvider>
                </PopUp>
            )}

            {members.length === 0 ? (
                <p className={styles.empty}>Gruppen har ingen medlemskap i orden {selectedOrder}.</p>
            ) : (
                <div className={styles.memberRows}>
                    {members.map(member => (
                        // Keyed by order as well as user: the title input is uncontrolled, so a row
                        // React reuses across an order change would keep the value it already has
                        // and ignore the new order's `defaultValue`. The same user is usually a
                        // member of several orders, which is exactly when that bites.
                        <div className={styles.memberRow} key={`${selectedOrder}-${member.userId}`}>
                            <span className={styles.name}>{member.name}</span>
                            {setMemberTitleAction ? (
                                <Form
                                    className={styles.titleForm}
                                    submitText="Lagre"
                                    submitColor="secondary"
                                    action={formData => setMemberTitleAction(
                                        { params: { groupId, order: selectedOrder } },
                                        {
                                            data: {
                                                userId: member.userId,
                                                title: String(formData.get('title') ?? ''),
                                            },
                                        }
                                    )}
                                    successCallback={refresh}
                                >
                                    <TextInput
                                        className={styles.titleInput}
                                        name="title"
                                        label="Tittel"
                                        defaultValue={member.title}
                                    />
                                </Form>
                            ) : (
                                <span className={styles.title}>{member.title}</span>
                            )}
                            {member.admin && <span className={styles.adminBadge}>Admin</span>}
                            {!member.active && <span className={styles.inactiveBadge}>Inaktiv</span>}
                            <span className={styles.spacer} />
                            {setMemberAdminAction && (
                                <Form
                                    submitText={member.admin ? 'Fjern admin' : 'Gjør til admin'}
                                    submitColor="secondary"
                                    action={() => setMemberAdminAction(
                                        { params: { groupId, order: selectedOrder } },
                                        { data: { userId: member.userId, admin: !member.admin } }
                                    )}
                                    successCallback={refresh}
                                />
                            )}
                            {removeMembersAction && member.active && (
                                <span>
                                    <Form
                                        submitText="Fjern"
                                        submitColor="red"
                                        action={() => removeMembersAction(
                                            { params: { groupId, order: selectedOrder } },
                                            { data: { userIds: [member.userId] } }
                                        )}
                                        successCallback={refresh}
                                        confirmation={{
                                            confirm: true,
                                            text: `Fjerne ${member.name} fra gruppen i orden ${selectedOrder}? `
                                                + 'Medlemskapet blir satt inaktivt.'
                                        }}
                                    />
                                </span>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

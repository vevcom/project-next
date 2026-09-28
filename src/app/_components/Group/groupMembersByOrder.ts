import type { ManageGroupMembersOrder } from './ManageGroupMembers'

type MembershipForManagement = {
    userId: number,
    order: number,
    active: boolean,
    admin: boolean,
    title: string,
    user: {
        firstname: string,
        lastname: string,
    },
}

/**
 * Shapes the memberships a group's `readMembers` returns for `ManageGroupMembers`: grouped by the
 * order they belong to, newest first.
 *
 * The group's own order is always included even when it holds no memberships - it is the order the
 * component opens on, and members have to be addable to an order that is still empty.
 */
export function groupMembersByOrder(
    memberships: MembershipForManagement[],
    groupOrder: number,
): ManageGroupMembersOrder[] {
    const membersByOrder = new Map<number, ManageGroupMembersOrder['members']>([[groupOrder, []]])

    memberships.forEach(membership => {
        membersByOrder.set(membership.order, [
            ...(membersByOrder.get(membership.order) ?? []),
            {
                userId: membership.userId,
                name: `${membership.user.firstname} ${membership.user.lastname}`,
                title: membership.title,
                admin: membership.admin,
                active: membership.active,
            },
        ])
    })

    return Array.from(membersByOrder, ([order, members]) => ({ order, members }))
        .sort((orderOne, orderTwo) => orderTwo.order - orderOne.order)
}

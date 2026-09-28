import type { MembershipFiltered } from '@/services/groups/types'
import type { Prisma } from '@/prisma-generated-pn-types'

export function visibilityFilter(memberships: MembershipFiltered[]) {
    return {
        requirements: {
            every: {
                conditions: {
                    some: {
                        OR: [
                            {
                                type: 'ACTIVE',
                                groupId: {
                                    in: memberships
                                        .filter(membership => membership.active)
                                        .map(membership => membership.groupId)
                                }
                            },
                            {
                                type: 'ORDER',
                                OR: memberships
                                    .map(membership => ({
                                        groupId: membership.groupId,
                                        order: membership.order
                                    }))
                            },
                        ]
                    }
                }
            }
        }
    } as const satisfies Prisma.VisibilityWhereInput
}

export type VisibilityFilter = ReturnType<typeof visibilityFilter>

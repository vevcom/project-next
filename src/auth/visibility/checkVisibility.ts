import type { MembershipFiltered } from '@/services/groups/types'
import type { VisibilityMatrix } from '@/services/visibility/types'


export function checkVisibility(memberships: MembershipFiltered[], visibility: VisibilityMatrix): boolean {
    return visibility.requirements.every(
        requirement => requirement.conditions.some(
            condition => {
                if (condition.type === 'ACTIVE') {
                    return memberships.some(
                        membership => membership.groupId === condition.groupId && membership.active
                    )
                }
                if (condition.type === 'ORDER') {
                    return memberships.some(
                        membership => membership.groupId === condition.groupId && membership.order === condition.order
                    )
                }
                return false
            }
        )
    )
}

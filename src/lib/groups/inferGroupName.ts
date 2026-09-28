import { ClassLevelConfig, OmegaMembershipLevelConfig } from '@/services/groups/constants'
import type { GroupWithRelationsNameInferencer } from '@/services/groups/types'

/**
 * Gives a group a display name based on its group type and the matching type-specific relation.
 */
export function inferGroupName(group: GroupWithRelationsNameInferencer): string {
    switch (group.groupType) {
        case 'COMMITTEE':
            return group.committee.name
        case 'MANUAL_GROUP':
            return group.manualGroup.name
        case 'CLASS':
            return ClassLevelConfig[group.class.level].name
        case 'INTEREST_GROUP':
            return group.interestGroup.name
        case 'OMEGA_MEMBERSHIP_GROUP':
            return OmegaMembershipLevelConfig[group.omegaMembershipGroup?.omegaMembershipLevel].name
        case 'STUDY_PROGRAMME':
            return group.studyProgramme?.name
        default:
    }
    return 'Group with unknown name'
}

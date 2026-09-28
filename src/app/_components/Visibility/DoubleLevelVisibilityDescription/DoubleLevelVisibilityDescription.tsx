'use client'
import styles from './DoubleLevelVisibilityDescription.module.scss'
import { describeMatrix } from '@/auth/visibility/describeVisibility'
import { useGroups } from '@/contexts/ClientData'
import { flattenExpandedGroups } from '@/services/groups/flattenExpandedGroups'
import type { DoubleLevelVisibilityMatrix } from '@/services/visibility/types'

type PropTypes = {
    doubleLevelVisibility: DoubleLevelVisibilityMatrix,
}

/**
 * A human readable "who can see / who administrates" description of a DoubleLevelVisibilityMatrix -
 * reusable by any service built on `implementDoubleLevelVisibilityOperations`, not just image collections.
 */
export default function DoubleLevelVisibilityDescription({ doubleLevelVisibility }: PropTypes) {
    const groupsResult = useGroups()
    const groups = groupsResult.status === 'success' ? flattenExpandedGroups(groupsResult.groups) : null

    return (
        <p className={styles.DoubleLevelVisibilityDescription}>
            <span>Kan se: {describeMatrix(doubleLevelVisibility.regularLevel, groups)}</span>
            <span>Kan administrere: {describeMatrix(doubleLevelVisibility.adminLevel, groups)}</span>
        </p>
    )
}

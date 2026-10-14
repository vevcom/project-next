'use client'
import styles from './LockerList.module.scss'
import LockerRow from './LockerRow'
import EndlessScroll from '@/components/PagingWrappers/EndlessScroll'
import { LockerPagingContext } from '@/contexts/paging/LockerPaging'
import { useContext } from 'react'

export default function LockerList() {
    const context = useContext(LockerPagingContext)
    if (!context) throw new Error('Ingen kontekst')
    return (
        <div className={styles.lockerList}>
            <div className={styles.lockerListHeader}>
                <h3>Skap nr.</h3>
                <h3>Bygg</h3>
                <h3>Etasje</h3>
                <h3 className={styles.hideSecond}>Person</h3>
                <h3 className={styles.hideFirst}>Gruppe</h3>
                <h3>Dato</h3>
            </div>
            <div>
                <EndlessScroll
                    pagingContext={LockerPagingContext}
                    renderer={(locker) => <LockerRow locker={locker} key={locker.id} />}
                />
            </div>
        </div>
    )
}

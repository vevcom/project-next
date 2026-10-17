'use client'
import LockerRow from './LockerRow'
import EndlessScroll from '@/components/PagingWrappers/EndlessScroll'
import { LockerPagingContext } from '@/contexts/paging/LockerPaging'
import { useContext } from 'react'

export default function LockerList() {
    const context = useContext(LockerPagingContext)
    if (!context) throw new Error('Ingen kontekst')
    return (
        <div className={[
            'bg-surface-raised drop-shadow-[5px_15px_5px_rgba(0,0,0,0.3)] border border-surface-subtle',
            'rounded-[10px] p-[1em]',
        ].join(' ')}>
            <div className={[
                'grid grid-cols-6 border-b-2 border-surface-subtle [&_h3]:p-[1rem]',
                'max-[600px]:grid-cols-5 max-[500px]:grid-cols-4',
            ].join(' ')}>
                <h3>Skap nr.</h3>
                <h3>Bygg</h3>
                <h3>Etasje</h3>
                <h3 className="max-[500px]:hidden">Person</h3>
                <h3 className="max-[600px]:hidden">Gruppe</h3>
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

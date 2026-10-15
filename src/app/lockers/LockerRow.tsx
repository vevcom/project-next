// import { checkGroupValidity, inferGroupName } from '@/services/groups/read'
import Link from 'next/link'
import type { LockerWithReservation } from '@/services/lockers/types'

type PropTypes = {
    locker: LockerWithReservation
}

export default function LockerRow({ locker }: PropTypes) {
    const isReserved = locker.LockerReservation.length > 0
    const reservation = locker.LockerReservation[0]
    const groupName = 'test'
    // TODO fix groupName
    // const groupName = (isReserved && reservation.group) ? inferGroupName(checkGroupValidity(reservation.group)) : ''

    let endDateText = ''
    if (isReserved) {
        if (reservation.endDate === null) {
            endDateText = 'ubestemt'
        } else {
            endDateText = reservation.endDate.toLocaleDateString()
        }
    }

    return (
        <Link href={`/lockers/${locker.id}`} className={[
            'grid grid-cols-6 no-underline text-inherit hover:bg-[rgba(0,0,0,0.05)] [&_p]:py-[.5rem] [&_p]:px-[1rem]',
            'max-[600px]:grid-cols-5 max-[500px]:grid-cols-4',
        ].join(' ')}>
            <p>{locker.id}</p>
            <p>{locker.building}</p>
            <p>{locker.floor}</p>
            <p className="max-[500px]:hidden">
                {isReserved ? `${reservation.user.firstname} ${reservation.user.lastname}` : ''}
            </p>
            <p className="max-[600px]:hidden">{groupName}</p>
            <p>{endDateText}</p>
        </Link>
    )
}

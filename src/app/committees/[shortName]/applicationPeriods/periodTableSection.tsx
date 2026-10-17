'use client' //Use client to show user correct local time
import Link from 'next/link'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faLink } from '@fortawesome/free-solid-svg-icons'
import type { readAllCommitteeParticipationAction } from '@/services/applications/committeeParticipation/actions'

export type CommitteeParticipationPeriodType =
    Pick<Awaited<ReturnType<typeof readAllCommitteeParticipationAction>> & { success: true }, 'data'>['data'][number]


export function PeriodSection({ period, shortName }: { period: CommitteeParticipationPeriodType, shortName: string }) {
    const currentPeriodClassName = period.isOpen ? 'font-bold bg-[hsla(120,100%,70%,0.288)]' : ''
    const entriesClassName = `border-2 border-[hsla(0,0%,70%,0.507)] p-[1em] ${currentPeriodClassName}`
    return (
        <tr>
            <td className={entriesClassName} >
                {period.startDate.toLocaleDateString('en-GB')},
                kl: {period.startDate.toLocaleTimeString('en-GB')}
            </td>
            <td className={entriesClassName} >
                {period.endDate.toLocaleDateString('en-GB')},
                kl: {period.endDate.toLocaleTimeString('en-GB')}
            </td>
            <td className={entriesClassName} >
                {period.endPriorityDate.toLocaleDateString('en-GB')},
                kl: {period.endPriorityDate.toLocaleTimeString('en-GB')}
            </td>
            <td className={entriesClassName} >
                <Link href={`/committees/${shortName}/applicationPeriods/${period.participationId}`} >
                    <FontAwesomeIcon icon={faLink}>
                    </FontAwesomeIcon>
                </Link>
            </td>
            <td className={entriesClassName} >{period.applicationCount}</td>
        </tr>
    )
}

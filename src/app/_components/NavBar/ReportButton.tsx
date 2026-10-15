'use client'
import useAuthorizer from '@/hooks/useAuthorizer'
import { reportAuth } from '@/services/report/auth'
import Link from 'next/link'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faShieldHeart } from '@fortawesome/free-solid-svg-icons'

export default function ReportButton() {
    const canRead = useAuthorizer({ authorizer: reportAuth.read }).authorized

    if (!canRead) return <></>

    return (
        <div className="cursor-pointer mx-2">
            <Link href="/report">
                <FontAwesomeIcon className={[
                    'w-[40px]! h-[40px]! p-2 rounded-[calc(2*var(--gap))] text-text transition-all duration-300',
                    'hover:bg-accent-red',
                ].join(' ')} icon={faShieldHeart} />
            </Link>
        </div>

    )
}

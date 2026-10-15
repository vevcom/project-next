'use client'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import type { IconProp } from '@fortawesome/fontawesome-svg-core'
import type { ReactNode } from 'react'

type SubPageNavBarProps = {
    children?: ReactNode,
    icon?: IconProp,
    href: string
}

export function SubPageNavBarItem({ children, icon, href }:SubPageNavBarProps) {
    const pathname = usePathname()
    const page = pathname.split('/').pop()
    const thisPage = href?.split('/').pop()

    return (
        <div className="m-0 grow-0 last:mb-0 [&>a]:no-underline">
            <Link href={href}>
                <div className={[
                    'inline-flex items-center justify-center h-[calc(64px-2*var(--gap))] px-2 border-0 rounded-inner',
                    'max-mobile:px-1 bg-transparent',
                    'transition-[background,color] duration-200 ease-[ease] hover:bg-accent-blue hover:text-text',
                    page === thisPage ? 'text-accent-blue [&_*]:text-accent-blue hover:[&_*]:text-text' : 'text-text',
                ].join(' ')}>
                    {icon && <FontAwesomeIcon icon={icon} className="w-[24px]! h-[24px]!" />}
                    <p className="leading-[calc(64px-32px)] text-center pl-[16px] max-mobile:hidden">{children}</p>
                </div>
            </Link>
        </div>
    )
}

export function SubPageNavBar({ children }: {children: ReactNode}) {
    return (<>
        <div className={[
            'grid grid-flow-col auto-cols-max col-span-full justify-center gap-1 w-full mx-auto p-2 h-[64px]',
            'sticky bottom-0 z-2 rounded-round bg-surface-base overflow-x-auto',
        ].join(' ')}>
            {children}
        </div>
    </>)
}

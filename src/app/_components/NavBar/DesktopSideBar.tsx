'use client'

import { adminNavItemHref } from './adminNavItemHref'
import SideBarNavItem from './SideBarNavItem'
import AdminNav from './AdminNav'
import ScrollIndicator from '@/components/ScrollIndicator/ScrollIndicator'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons'
import { useRef, useState } from 'react'
import type { NavLink } from './navDef'

export type PropTypes = {
    /** The nav items the session may open, as `visibleNavItems` leaves them. */
    navItems: NavLink[]
}

export default function DesktopSideBar({ navItems }: PropTypes) {
    const [expanded, setExpanded] = useState(false)
    const navIconsRef = useRef<HTMLElement>(null)

    // The admin item gets its own spot at the bottom rather than a place among the others.
    const showAdmin = navItems.some(item => item.href === adminNavItemHref)
    const sideBarItems = navItems.filter(item => item.href !== adminNavItemHref)
    return (
        <aside className="group/sidebar h-full w-full flex flex-col items-stretch gap-2 min-h-0" data-expanded={expanded}>
            <div className="group/panel relative rounded-round p-2 bg-surface-base w-full flex-auto min-h-0">
                <nav ref={navIconsRef} className={[
                    'h-full w-full flex flex-col items-stretch gap-1 overflow-y-auto overflow-x-hidden',
                    '[scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
                ].join(' ')} aria-label="Desktop navigation">
                    {sideBarItems.map((item) => (
                        <SideBarNavItem key={item.name} item={item} expanded={expanded} />
                    ))}
                </nav>
                <ScrollIndicator scrollRef={navIconsRef} className={[
                    'top-2 bottom-2 right-0.5 opacity-0 transition-opacity duration-300 ease-[ease]',
                    'group-hover/panel:opacity-100 group-focus-within/panel:opacity-100',
                ].join(' ')} />
            </div>
            <AdminNav showAdmin={showAdmin} expanded={expanded} />
            <button
                type="button"
                className={[
                    'w-full h-10 flex items-center justify-center shrink-0 border-none rounded-round',
                    'bg-surface-base text-text cursor-pointer transition-[background,color] duration-300 ease-[ease]',
                    'hover:bg-accent-blue hover:text-text-inv',
                ].join(' ')}
                onClick={() => setExpanded(prev => !prev)}
                aria-label={expanded ? 'Collapse navigation' : 'Expand navigation'}
            >
                <FontAwesomeIcon icon={expanded ? faChevronLeft : faChevronRight} />
            </button>
        </aside>
    )
}

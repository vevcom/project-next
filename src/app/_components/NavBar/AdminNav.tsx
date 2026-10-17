'use client'
import { navIconClassName, navIconIconClassName, navIconLabelClassName } from './sideBarClassNames'
import NavTooltip from './NavTooltip'
import EditModeNavIcon from './EditModeNavIcon'
import { EditModeContext } from '@/contexts/EditMode'
import Link from 'next/link'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCog } from '@fortawesome/free-solid-svg-icons'
import { useContext } from 'react'

type PropTypes = {
    /** Whether any page of `adminNavDef` is one the session may open. */
    showAdmin: boolean
    expanded?: boolean
}

/**
 * Renders nothing at all - not even the wrapping nav/background panel -
 * when there's neither an admin link nor an edit-mode icon to show.
 * DesktopSideBar only knows whether there's an admin page to open; whether
 * there's something to edit is only known client-side via
 * EditModeContext, so that decision has to live in a client component.
 */
export default function AdminNav({ showAdmin, expanded = false }: PropTypes) {
    const editModeCtx = useContext(EditModeContext)
    if (!showAdmin && !editModeCtx?.somethingToEdit) return null

    const adminLink = (
        <Link href="/admin" className={navIconClassName} aria-label="Admin">
            <FontAwesomeIcon icon={faCog} className={navIconIconClassName} />
            <span className={navIconLabelClassName}>Admin</span>
        </Link>
    )

    return (
        <nav
            className="rounded-round p-2 bg-surface-base w-full flex flex-col items-stretch shrink-0"
            aria-label="Adminnavigasjon"
        >
            <EditModeNavIcon className={navIconClassName} expanded={expanded} />
            {showAdmin && (
                expanded ? adminLink : <NavTooltip content="Admin">{adminLink}</NavTooltip>
            )}
        </nav>
    )
}

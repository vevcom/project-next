'use client'
import styles from './SlideSidebar.module.scss'
import useOnNavigation from '@/hooks/useOnNavigation'
import useClickOutsideRef from '@/hooks/useClickOutsideRef'
import useKeyPress from '@/hooks/useKeyPress'
import { Fragment, useState } from 'react'
import Link from 'next/link'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
    faChild,
    faKey,
    faUser,
    faUserGroup,
    faPaperPlane,
    faSchool,
    faDotCircle,
    faHouse,
    faShop,
    faListDots,
    faMoneyBillWave,
    faBars,
    faXmark,
} from '@fortawesome/free-solid-svg-icons'
import type { IconDefinition } from '@fortawesome/free-solid-svg-icons'

/**
 * Declaration for the admin navigation links.
 */
const navigations = [
    {
        header: {
            icon: faUser,
            title: 'Brukere'
        },
        links: [
            {
                title: 'Brukere',
                href: '/admin/users'
            }
        ],
    },
    {
        header: {
            icon: faChild,
            title: 'Opptak og tilstand'
        },
        links: [
            {
                title: 'Opptak',
                href: '/admin/admission'
            },
            {
                title: 'Omegas tilstand',
                href: '/admin/stateOfOmega'
            }
        ],
    },
    {
        header: {
            icon: faUserGroup,
            title: 'Grupper'
        },
        links: [
            {
                title: 'Klasser',
                href: '/admin/classes'
            },
            {
                title: 'Komitéer',
                href: '/admin/committees'
            },
            {
                title: 'Interessegrupper',
                href: '/admin/interest-groups'
            },
            {
                title: 'Medlemsgrupper',
                href: '/admin/omega-membership-groups'
            },
            {
                title: 'Studieprogrammer',
                href: '/admin/study-programmes'
            },
            {
                title: 'Andre grupper',
                href: '/admin/manual-groups'
            }
        ],
    },
    {
        header: {
            icon: faKey,
            title: 'Tillgangsstyring'
        },
        links: [
            {
                title: 'Gruppe Tilganger',
                href: '/admin/group-permissions'
            },
            {
                title: 'Standard Tilganger',
                href: '/admin/default-permissions'
            },
            {
                title: 'API Nøkler',
                href: '/admin/api-keys'
            },
        ],
    },
    {
        header: {
            icon: faPaperPlane,
            title: 'Varslinger'
        },
        links: [
            {
                title: 'Send varsel',
                href: '/admin/send-notification'
            },
            {
                title: 'Varslingkanaler',
                href: '/admin/notification-channels'
            },
            {
                title: 'Mailing lister',
                href: '/admin/mail'
            },
            {
                title: 'Send e-post',
                href: '/admin/send-mail'
            }
        ]
    }, {
        header: {
            icon: faSchool,
            title: 'Fagvev'
        },
        links: [
            {
                title: 'Skoler',
                href: '/admin/schools'
            },
            {
                title: 'Emnekatalog',
                href: '/admin/courses'
            }
        ],
    },
    {
        header: {
            icon: faDotCircle,
            title: 'Prikker'
        },
        links: [
            {
                title: 'Prikker',
                href: '/admin/dots'
            },
            {
                title: 'Frysperioder',
                href: '/admin/dots-freeze-periods'
            },
        ]
    },
    {
        header: {
            icon: faHouse,
            title: 'Heutte'
        },
        links: [
            {
                title: 'Perioder',
                href: '/admin/cabin-periods',
            },
            {
                title: 'Produkter',
                href: '/admin/cabin-product',
            },
            {
                title: 'Bookinger',
                href: '/admin/cabin-booking',
            },
        ]
    },
    {
        header: {
            icon: faShop,
            title: 'Shop'
        },
        links: [
            {
                title: 'Butikker',
                href: '/admin/shop'
            },
            {
                title: 'Produkter',
                href: '/admin/product'
            },
        ]
    },
    {
        header: {
            title: 'Økonomi',
            icon: faMoneyBillWave,
        },
        links: [
            {
                title: 'Kontoer',
                href: '/admin/accounts'
            },
        ]
    },
    {
        header: {
            title: 'Annet',
            icon: faListDots
        },
        links: [
            {
                title: 'Lisenser',
                href: '/admin/licenses'
            },
            {
                title: 'Flairs',
                href: '/admin/flairs'
            },
            {
                title: 'Komponenter',
                href: '/admin/component-test'
            },
        ]
    }
] satisfies {
    header: {
        icon: IconDefinition
        title: string
    },
    links: {
        title: string
        href: string
    }[]
}[]

type PropTypes = {
    currentPath: string
}

/**
 * Component that renders a sidebar that can be toggled on and off.
 * @param children - The children to render in the sidebar.
 * @returns
 */
export default function SlideSidebar({ currentPath }: PropTypes) {
    const [open, setOpen] = useState(currentPath === 'admin')

    useOnNavigation(() => setOpen(currentPath === 'admin'))

    const sidebarRef = useClickOutsideRef(() => setOpen(false))
    useKeyPress('Escape', () => setOpen(false))

    return <div className={`${styles.SlideSidebar} ${open ? styles.open : ''}`}>
        <div className={styles.backdrop} />
        <div ref={sidebarRef}>
            <button
                type="button"
                className={styles.toggleButton}
                aria-label={open ? 'Lukk meny' : 'Åpne meny'}
                aria-expanded={open}
                onClick={() => setOpen(previousOpen => !previousOpen)}
            >
                <FontAwesomeIcon icon={open ? faXmark : faBars} />
            </button>
            <aside className={styles.sidebar}>
                {
                    navigations.map(navigation => (
                        <Fragment key={navigation.header.title}>
                            <h3>
                                <FontAwesomeIcon icon={navigation.header.icon} />
                                {navigation.header.title}
                            </h3>
                            {
                                navigation.links.map(link => (
                                    <Link
                                        key={link.title}
                                        href={link.href}
                                        className={link.href === `/admin/${currentPath}` ? styles.active : ''}
                                    >
                                        {link.title}
                                    </Link>
                                ))
                            }
                        </Fragment>
                    ))
                }
            </aside>
        </div>
    </div>
}

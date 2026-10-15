import Item from './Item'
import UserNavigation from './UserNavigation'
import ReportButton from './ReportButton'
import SearchButton from './SearchButton'
import NavBarTitle from './NavBarTitle'
import PageTitleSetter from '@/contexts/PageTitleSetter'
import StandardImageServer from '@/components/Image/StandardImageServer'
import ProfilePicture from '@/components/User/ProfilePicture'
import Link from 'next/link'
import type { ExpandedImage } from '@/services/images/subservice/types'
import type { NavLink } from './navDef'

export type PropTypes = {
    isLoggedIn: boolean,
    profileImage: ExpandedImage | null,
    /** The nav items the session may open, as `visibleNavItems` leaves them. */
    navItems: NavLink[],
}

export default async function NavBar({ isLoggedIn, profileImage, navItems }: PropTypes) {
    const navSize = 4
    const itemsForNav = navItems.slice(0, navSize - 1)

    return (
        <nav className="text-text text-m w-full h-[64px]">
            <ul className="w-full h-full flex flex-row justify-start items-center list-none">
                <li className={[
                    'flex items-center justify-center h-full relative',
                    'bg-surface-base rounded-[calc(2*var(--gap))] p-2',
                ].join(' ')}>
                    <Link aria-label={'Gå til hjemmesiden'} href="/" className="flex items-center justify-center">
                        <div className="size-[48px] rounded-(--gap) bg-accent-blue p-2 flex items-center justify-center">
                            <StandardImageServer
                                standardImage="LOGO_SIMPLE"
                                width={30}
                                alt="omega logo"
                                tint="var(--surface-base)"
                            />
                        </div>
                    </Link>
                </li>

                <PageTitleSetter title="" />
                <li
                    className={[
                        'min-w-0 ml-2 flex items-center',
                        'max-mobile:[body:has([data-slide-sidebar-toggle])_&]:pr-[calc(44px+2*var(--gap))]',
                    ].join(' ')}
                    data-nav-title
                >
                    <NavBarTitle />
                </li>
                <li className="grow"></li>
                {
                    itemsForNav.map((item) => (
                        <li className="hidden" key={item.name}>
                            <Item key={item.name} {...item} />
                        </li>
                    ))
                }
                <li className="flex w-auto ml-auto items-center max-mobile:hidden">
                    <SearchButton/>
                    <ReportButton/>
                    <div className={[
                        // Overrides of btn's own margin, radius and padding need ! to win regardless of utility order.
                        'btn relative m-0! h-[64px] flex items-center justify-center',
                        'rounded-[calc(2*var(--gap))]! whitespace-nowrap',
                        isLoggedIn ? 'w-[64px] p-0!' : 'w-auto px-4! py-0! font-medium',
                    ].join(' ')}>
                        {
                            profileImage ? (
                                <ProfilePicture
                                    profileImage={profileImage}
                                    width={48}
                                />
                            ) : (
                                <span>Logg inn</span>
                            )
                        }
                        <UserNavigation isLoggedIn={isLoggedIn} />
                    </div>
                </li>
            </ul>
        </nav>
    )
}

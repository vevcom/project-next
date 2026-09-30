import styles from './layout.module.scss'
import { unwrapActionReturn } from './redirectToErrorPage'
import { SessionProvider } from '@/auth/session/useSession'
import MobileNavBar from '@/components/NavBar/MobileNavBar'
import { authOptions } from '@/auth/nextAuth/authOptions'
import EditModeProvider from '@/contexts/EditMode'
import PopUpProvider from '@/contexts/PopUp'
import ClientDataProvider from '@/contexts/ClientData'
import { PageTitleProvider } from '@/contexts/PageTitle'
import { readDefaultPermissionsAction } from '@/services/permissions/actions'
import { readAllStandardImagesAction } from '@/services/images/standard/actions'
import { readUserProfileAction } from '@/services/users/actions'
import { readReleaseCountdownIsActiveAction } from '@/services/releaseCountdown/actions'
import { RELEASE_DATE } from '@/services/releaseCountdown/constants'
import ReleaseCountdown from '@/components/ReleaseCountdown/ReleaseCountdown'
import { ServerSession } from '@/auth/session/ServerSession'
import ThemeEnabler from '@/UI/ThemeEnabler'
import ServiceWorkerRegister from '@/UI/ServiceWorkerRegister'
import GlobalSearch from '@/UI/GlobalSearch'
import DesktopSideBar from '@/components/NavBar/DesktopSideBar'
import { Inter } from 'next/font/google'
import '@/styles/globals.scss'
import { config } from '@fortawesome/fontawesome-svg-core'
import '@fortawesome/fontawesome-svg-core/styles.css'
import { getServerSession } from 'next-auth'
import type { ReactNode } from 'react'
import type { Metadata, Viewport } from 'next'
import NavBar from '@/components/NavBar/NavBar'

config.autoAddCss = false

const inter = Inter({ subsets: ['latin'] })

export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
    // Lets the page paint into the status bar and home indicator areas instead of
    // being letterboxed between them. The safe-area insets in layout.module.scss
    // are what then keep the nav bars clear of the system UI.
    viewportFit: 'cover',
    // Only the pre-hydration default, matching --surface-base in globals.scss;
    // applyTheme() rewrites this meta to the active theme's surface-base.
    themeColor: '#131316',
}

export const metadata: Metadata = {
    title: {
        default: 'Sct. Omega Broderskab',
        template: '%s | Sct. Omega Broderskab',
    },
    description: 'Hjemmesiden for linjeforeningen Sanctus Omega Broderskab ved NTNU.',
    keywords: ['Sanctus Omega Broderskab', 'Sct. Omega Broderskab', 'Sanctus Omega', 'Sct. Omega', 'Omega'],
    appleWebApp: {
        capable: true,
        title: 'Sct. Omega',
        // The only iOS value that lets the page draw behind the status bar - the
        // other two reserve an opaque strip for it. It forces light status bar
        // text, which is why the light themes need a scrim (see PR notes).
        statusBarStyle: 'black-translucent',
    },
}

type PropTypes = {
    children: ReactNode
}

export default async function RootLayout({ children }: PropTypes) {
    const nextAuthSession = await getServerSession(authOptions)
    const serverSession = await ServerSession.fromNextAuth()

    const defaultPermissionsRes = await readDefaultPermissionsAction()
    const defaultPermissions = defaultPermissionsRes.success ? defaultPermissionsRes.data : undefined
    const standardImagesRes = await readAllStandardImagesAction()
    const standardImages = standardImagesRes.success ? standardImagesRes.data : undefined
    const profile = serverSession?.user ?
        unwrapActionReturn(await readUserProfileAction({ params: { username: serverSession.user.username } })) : null
    // The nav components get the fields they actually render rather than the whole profile,
    // so nothing beyond these reaches the client components among them.
    const navUser = profile?.user ?? null
    const releaseCountdownIsActive = unwrapActionReturn(await readReleaseCountdownIsActiveAction())

    return (
        <html lang="en">
            <body className={`${inter.className} ${styles.body}`}>
                <ThemeEnabler />
                <ServiceWorkerRegister />
                <SessionProvider session={nextAuthSession}>
                    <ClientDataProvider
                        session={serverSession.toJsObject()}
                        defaultPermissions={defaultPermissions}
                        standardImages={standardImages}
                    >
                        <GlobalSearch profile={profile} />
                        <EditModeProvider>
                            <PopUpProvider>
                                <PageTitleProvider>
                                    {releaseCountdownIsActive ? (
                                        <ReleaseCountdown releaseDate={RELEASE_DATE.getTime()} />
                                    ) : (
                                        <div className={styles.wrapper}>
                                            <div className={styles.navBar}>
                                                <NavBar
                                                    username={navUser?.username ?? null}
                                                    profileImage={navUser?.image ?? null}
                                                />
                                            </div>
                                            <aside className={styles.sideBar}>
                                                <DesktopSideBar username={navUser?.username ?? null} />
                                            </aside>
                                            <main className={styles.content}>
                                                {children}
                                            </main>
                                            <div className={styles.mobileNavBar}>
                                                <MobileNavBar
                                                    isLoggedIn={navUser !== null}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </PageTitleProvider>
                            </PopUpProvider>
                        </EditModeProvider>
                    </ClientDataProvider>
                </SessionProvider>
            </body>
        </html>
    )
}

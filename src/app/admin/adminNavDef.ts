import { userAuth } from '@/services/users/auth'
import { admissionAuth } from '@/services/admission/auth'
import { omegaOrderAuth } from '@/services/omegaOrder/auth'
import { classAuth } from '@/services/groups/classes/auth'
import { committeeAuth } from '@/services/groups/committees/auth'
import { interestGroupAuth } from '@/services/groups/interestGroups/auth'
import { omegaMembershipGroupAuth } from '@/services/groups/omegaMembershipGroups/auth'
import { studyProgrammeAuth } from '@/services/groups/studyProgrammes/auth'
import { manualGroupAuth } from '@/services/groups/manualGroups/auth'
import { permissionsAuth } from '@/services/permissions/auth'
import { apiKeyAuth } from '@/services/apiKeys/auth'
import { notificationAuth } from '@/services/notifications/auth'
import { sendMailAuth } from '@/services/notifications/send-mail/auth'
import { notificationChannelAuth } from '@/services/notifications/channel/auth'
import { mailAliasAuth } from '@/services/mail/alias/auth'
import { mailingListAuth } from '@/services/mail/list/auth'
import { mailAddressExternalAuth } from '@/services/mail/mailAddressExternal/auth'
import { schoolAuth } from '@/services/education/schools/auth'
import { dotAuth } from '@/services/dots/auth'
import { dotFreezePeriodAuth } from '@/services/dots/freezePeriods/auth'
import { cabinPricePeriodAuth } from '@/services/cabin/pricePeriod/auth'
import { cabinReleasePeriodAuth } from '@/services/cabin/releasePeriod/auth'
import { cabinProductAuth } from '@/services/cabin/product/auth'
import { cabinBookingAuth } from '@/services/cabin/booking/auth'
import { shopAuth } from '@/services/shop/shop/auth'
import { productAuth } from '@/services/shop/product/auth'
import { ledgerAccountAuth } from '@/services/ledger/accounts/auth'
import { promoAuth } from '@/services/promo/auth'
import { licenseAuth } from '@/services/licenses/auth'
import { flairAuth } from '@/services/flairs/auth'
import { RequirePermission } from '@/auth/authorizer/RequirePermission'
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
} from '@fortawesome/free-solid-svg-icons'
import type { AuthorizerDynamicFieldsBound } from '@/auth/authorizer/Authorizer'
import type { SessionMaybeUser } from '@/auth/session/Session'
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core'

export type AdminNavLink = {
    title: string,
    /** Appended to `/admin`. */
    path: string,
    /**
     * One authorizer per thing the page lets you administer, and passing **any** of them is enough
     * to be shown it. They are the administering authorizers rather than the reading ones on
     * purpose: reads are routinely granted as default permissions, and a read alone would put the
     * admin button in front of everyone.
     *
     * The same list is what `authorizeAdminPage` guards the page with, so a link is never shown to
     * a page that would turn the viewer away.
     */
    authorizers: () => AuthorizerDynamicFieldsBound[],
}

export type AdminNavGroup = {
    header: {
        icon: IconDefinition,
        title: string,
    },
    links: AdminNavLink[],
}

/**
 * The admin pages, grouped and in the order the sidebar shows them.
 */
export const adminNavDef: AdminNavGroup[] = [
    {
        header: { icon: faUser, title: 'Brukere' },
        links: [
            {
                title: 'Brukere',
                path: 'users',
                authorizers: () => [userAuth.create.dynamicFields({})],
            },
        ],
    },
    {
        header: { icon: faChild, title: 'Opptak og tilstand' },
        links: [
            {
                title: 'Opptak',
                path: 'admission',
                authorizers: () => [
                    admissionAuth.createTrial.dynamicFields({}),
                    omegaMembershipGroupAuth.updateUserLevel.dynamicFields({}),
                    omegaMembershipGroupAuth.updateUserOrder.dynamicFields({}),
                ],
            },
            {
                title: 'Omegas tilstand',
                path: 'stateOfOmega',
                authorizers: () => [omegaOrderAuth.create.dynamicFields({})],
            },
        ],
    },
    {
        header: { icon: faUserGroup, title: 'Grupper' },
        links: [
            {
                title: 'Klasser',
                path: 'classes',
                authorizers: () => [
                    classAuth.bumpClasses.dynamicFields({}),
                    classAuth.changeClassOfUser.dynamicFields({}),
                ],
            },
            {
                title: 'Komitéer',
                path: 'committees',
                authorizers: () => [
                    committeeAuth.create.dynamicFields({}),
                    committeeAuth.update.dynamicFields({}),
                ],
            },
            {
                title: 'Interessegrupper',
                path: 'interest-groups',
                authorizers: () => [interestGroupAuth.create.dynamicFields({})],
            },
            {
                title: 'Medlemsgrupper',
                path: 'omega-membership-groups',
                authorizers: () => [
                    omegaMembershipGroupAuth.updateUserLevel.dynamicFields({}),
                    omegaMembershipGroupAuth.updateUserOrder.dynamicFields({}),
                ],
            },
            {
                title: 'Studieprogrammer',
                path: 'study-programmes',
                authorizers: () => [
                    studyProgrammeAuth.create.dynamicFields({}),
                    studyProgrammeAuth.update.dynamicFields({}),
                ],
            },
            {
                title: 'Andre grupper',
                path: 'manual-groups',
                authorizers: () => [
                    manualGroupAuth.create.dynamicFields({}),
                    manualGroupAuth.update.dynamicFields({}),
                ],
            },
        ],
    },
    {
        header: { icon: faKey, title: 'Tillgangsstyring' },
        links: [
            {
                title: 'Gruppe Tilganger',
                path: 'group-permissions',
                authorizers: () => [permissionsAuth.updateGroupPermission.dynamicFields({})],
            },
            {
                title: 'Standard Tilganger',
                path: 'default-permissions',
                authorizers: () => [permissionsAuth.updateDefaultPermissions.dynamicFields({})],
            },
            {
                title: 'API Nøkler',
                path: 'api-keys',
                authorizers: () => [apiKeyAuth.readMany.dynamicFields({})],
            },
        ],
    },
    {
        header: { icon: faPaperPlane, title: 'Varslinger' },
        links: [
            {
                title: 'Send varsel',
                path: 'send-notification',
                authorizers: () => [notificationAuth.create.dynamicFields({})],
            },
            {
                title: 'Varslingkanaler',
                path: 'notification-channels',
                authorizers: () => [
                    notificationChannelAuth.create.dynamicFields({}),
                    notificationChannelAuth.update.dynamicFields({}),
                ],
            },
            {
                title: 'Mailing lister',
                path: 'mail',
                authorizers: () => [
                    mailAliasAuth.create.dynamicFields({}),
                    mailingListAuth.create.dynamicFields({}),
                    mailAddressExternalAuth.create.dynamicFields({}),
                ],
            },
            {
                title: 'Send e-post',
                path: 'send-mail',
                authorizers: () => [sendMailAuth.sendMail.dynamicFields({})],
            },
        ],
    },
    {
        header: { icon: faSchool, title: 'Fagvev' },
        links: [
            {
                title: 'Skoler',
                path: 'schools',
                authorizers: () => [
                    schoolAuth.create.dynamicFields({}),
                    schoolAuth.update.dynamicFields({}),
                ],
            },
            {
                // Courses have no service of their own yet, so the permission is required directly.
                title: 'Emnekatalog',
                path: 'courses',
                authorizers: () => [RequirePermission.staticFields({ permission: 'COURSES_ADMIN' }).dynamicFields({})],
            },
        ],
    },
    {
        header: { icon: faDotCircle, title: 'Prikker' },
        links: [
            {
                title: 'Prikker',
                path: 'dots',
                authorizers: () => [
                    dotAuth.update.dynamicFields({}),
                    dotAuth.destroy.dynamicFields({}),
                ],
            },
            {
                title: 'Frysperioder',
                path: 'dots-freeze-periods',
                authorizers: () => [
                    dotFreezePeriodAuth.create.dynamicFields({}),
                    dotFreezePeriodAuth.update.dynamicFields({}),
                ],
            },
        ],
    },
    {
        header: { icon: faHouse, title: 'Heutte' },
        links: [
            {
                title: 'Perioder',
                path: 'cabin-periods',
                authorizers: () => [
                    cabinReleasePeriodAuth.readMany.dynamicFields({}),
                    cabinPricePeriodAuth.readMany.dynamicFields({}),
                ],
            },
            {
                title: 'Produkter',
                path: 'cabin-product',
                authorizers: () => [cabinProductAuth.create.dynamicFields({})],
            },
            {
                title: 'Bookinger',
                path: 'cabin-booking',
                authorizers: () => [cabinBookingAuth.readMany.dynamicFields({})],
            },
        ],
    },
    {
        header: { icon: faShop, title: 'Shop' },
        links: [
            {
                title: 'Butikker',
                path: 'shop',
                authorizers: () => [shopAuth.create.dynamicFields({})],
            },
            {
                title: 'Produkter',
                path: 'product',
                authorizers: () => [
                    productAuth.create.dynamicFields({}),
                    productAuth.update.dynamicFields({}),
                ],
            },
        ],
    },
    {
        header: { icon: faMoneyBillWave, title: 'Økonomi' },
        links: [
            {
                title: 'Kontoer',
                path: 'accounts',
                authorizers: () => [ledgerAccountAuth.readPage.dynamicFields({})],
            },
        ],
    },
    {
        header: { icon: faListDots, title: 'Annet' },
        links: [
            {
                title: 'Promo',
                path: 'promo',
                authorizers: () => [promoAuth.readAll.dynamicFields({})],
            },
            {
                title: 'Lisenser',
                path: 'licenses',
                authorizers: () => [
                    licenseAuth.create.dynamicFields({}),
                    licenseAuth.update.dynamicFields({}),
                ],
            },
            {
                title: 'Flairs',
                path: 'flairs',
                authorizers: () => [
                    flairAuth.create.dynamicFields({}),
                    flairAuth.update.dynamicFields({}),
                ],
            },
            {
                // A showcase with nothing of its own to administer: it is for whoever administers
                // anything else, and must not be what puts the admin button in front of someone.
                title: 'Komponenter',
                path: 'component-test',
                authorizers: () => adminNavAuthorizers({ except: 'component-test' }),
            },
        ],
    },
]

/**
 * Every authorizer in the admin nav - passing any of them is what it takes to have an admin page to
 * open at all.
 */
export function adminNavAuthorizers({ except }: { except?: string } = {}): AuthorizerDynamicFieldsBound[] {
    return adminNavDef.flatMap(group => group.links)
        .filter(link => link.path !== except)
        .flatMap(link => link.authorizers())
}

/**
 * The groups of the admin nav with only the links the session may open, leaving out groups with
 * none left.
 */
export function visibleAdminNav(session: SessionMaybeUser): AdminNavGroup[] {
    return adminNavDef
        .map(group => ({
            ...group,
            links: group.links.filter(link => link.authorizers().some(
                authorizer => authorizer.auth(session).authorized
            )),
        }))
        .filter(group => group.links.length > 0)
}

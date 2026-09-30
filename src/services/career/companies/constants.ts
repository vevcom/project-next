import { expandedImageIncluder } from '@/services/images/subservice/constants'
import { CompanySponsorTier } from '@/prisma-generated-pn-types'
import type { Prisma } from '@/prisma-generated-pn-types'

export const logoIncluder = {
    logo: {
        include: {
            image: { include: expandedImageIncluder }
        }
    }
} as const satisfies Prisma.CompanyInclude

export const companySponsorTierDetails = {
    MAIN: {
        label: 'Hovedsamarbeidspartner',
        description: 'Ligger øverst i alle lister. Kun én bedrift kan ha denne plassen.',
    },
    SPONSOR: {
        label: 'Samarbeidspartner',
        description: 'Ligger over vanlige bedrifter, i vilkårlig rekkefølge seg imellom.',
    },
    NONE: {
        label: 'Vanlig bedrift',
        description: 'Ingen prioritering i listene.',
    },
} satisfies Record<CompanySponsorTier, { label: string, description: string }>

export const companySponsorTierOptions = Object.values(CompanySponsorTier).map(
    (tier): { value: CompanySponsorTier, label: string, key: string } => ({
        value: tier,
        label: companySponsorTierDetails[tier].label,
        key: tier,
    })
)

// Sponsors first: relies on the enum being declared in priority order in career.prisma. `id` only
// makes the order total.
export const companySponsorOrdering = [
    { sponsorTier: 'asc' },
    { id: 'asc' },
] as const satisfies Prisma.CompanyOrderByWithRelationInput[]

// Spelled out rather than reusing logoIncluder: this read needs no session, so every field here is
// public.
export const sponsorSelection = {
    id: true,
    name: true,
    website: true,
    sponsorTier: true,
    logo: {
        include: {
            image: { include: expandedImageIncluder }
        }
    },
} as const satisfies Prisma.CompanySelect

/**
 * Transaction-scoped advisory lock for sponsor tier updates. Promoting a company to MAIN demotes the
 * sitting main sponsor and promotes its own, so concurrent promotions can each miss the row the other
 * writes. A partial unique index would be the database's own answer, but Prisma cannot express one.
 * The number is arbitrary; it only has to stay unique among the application's advisory locks.
 */
export const companySponsorTierLockKey = 581_000_001

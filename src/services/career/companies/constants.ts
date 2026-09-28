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

/**
 * The labels and blurbs shown wherever a sponsor tier is displayed or picked. Keyed by the enum so
 * adding a tier to the schema is a type error here until it has been given a label.
 */
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

/**
 * The ordering every career listing sorts by: sponsors first, then the rest. `sponsorTier` ascending
 * relies on the enum being declared in priority order in career.prisma, and `id` is only there to
 * make the order total - companies within a tier have no ranking of their own.
 */
export const companySponsorOrdering = [
    { sponsorTier: 'asc' },
    { id: 'asc' },
] as const satisfies Prisma.CompanyOrderByWithRelationInput[]

/**
 * What the public sponsor strip in the footer needs, and nothing else. Spelled out as a selection
 * rather than reusing logoIncluder because this operation is readable without a session: every field
 * named here is published to anyone who loads the front page.
 */
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

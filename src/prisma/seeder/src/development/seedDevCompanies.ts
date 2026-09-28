import { companyOperations } from '@/services/career/companies/operations'
import { defineSeedOperation } from '@/seeder/src/defineSeedOperation'
import { upsert } from '@/seeder/src/upsert'
import type { PrismaClient } from '@/prisma-generated-pn-client'

const COMPANY_COUNT = 100

// The first few companies get a sponsor tier and a website so the ordering of the career listings,
// the badges that explain it, and the footer's sponsor strip are all visible in development without
// having to promote anyone by hand.
const SPONSORS_BY_INDEX = {
    0: { sponsorTier: 'MAIN', website: 'https://www.nordicsemi.com' },
    1: { sponsorTier: 'SPONSOR', website: 'https://www.kongsberg.com' },
    2: { sponsorTier: 'SPONSOR', website: null },
} as const

const devCompanySponsor = (index: number) =>
    SPONSORS_BY_INDEX[index as keyof typeof SPONSORS_BY_INDEX] ?? { sponsorTier: 'NONE', website: null }

export const devCompanyName = (index: number) => `dev_companies_${index}`

export const seedDevCompanies = defineSeedOperation(async (prisma: PrismaClient) => {
    await Promise.all(Array.from({ length: COMPANY_COUNT }).map((_, index) => upsert({
        checkExistance: () => prisma.company.findUnique({
            where: { name: devCompanyName(index) },
            select: { id: true },
        }),
        create: async () => {
            const company = await companyOperations.create({
                data: {
                    name: devCompanyName(index),
                    description: `${devCompanyName(index)} description`,
                }
            })
            // The create operation deliberately takes no tier - a tier only moves through
            // updateSponsorTier, which would demote the main sponsor we just seeded - so the seeded
            // sponsor fields are written straight to the row instead.
            await prisma.company.update({
                where: { id: company.id },
                data: devCompanySponsor(index),
            })
        },
        update: () => Promise.resolve(),
    })))
})

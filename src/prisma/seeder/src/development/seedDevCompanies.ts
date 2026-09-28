import { companyOperations } from '@/services/career/companies/operations'
import { defineSeedOperation } from '@/seeder/src/defineSeedOperation'
import { upsert } from '@/seeder/src/upsert'
import type { PrismaClient } from '@/prisma-generated-pn-client'

const COMPANY_COUNT = 100

// The first few companies get a sponsor tier so the ordering of the career listings - and the
// badges that explain it - are visible in development without having to promote anyone by hand.
const SPONSOR_TIER_BY_INDEX = {
    0: 'MAIN',
    1: 'SPONSOR',
    2: 'SPONSOR',
} as const

const devCompanySponsorTier = (index: number) =>
    SPONSOR_TIER_BY_INDEX[index as keyof typeof SPONSOR_TIER_BY_INDEX] ?? 'NONE'

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
            // tier is written straight to the row instead.
            await prisma.company.update({
                where: { id: company.id },
                data: { sponsorTier: devCompanySponsorTier(index) },
            })
        },
        update: () => Promise.resolve(),
    })))
})

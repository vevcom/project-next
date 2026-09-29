import { Session } from '@/auth/session/Session'
import { Smorekopp } from '@/services/error'
import { prisma } from '@/prisma-pn-client-instance'
import { companyOperations } from '@/services/career/companies/operations'
import { beforeAll, describe, expect, test } from '@jest/globals'
import type { CompanySponsorTier } from '@/prisma-generated-pn-types'

/**
 * The company register is seeded with real sponsors before the tests run, so these tests cannot
 * assume they own the table. Every company they create carries this marker in its name, and every
 * read filters on it through the readPage name filter, which leaves the seeded companies out.
 */
const NAME_MARKER = 'Tiertest'

const COMPANY_NAMES = [
    `${NAME_MARKER} Alfa AS`,
    `${NAME_MARKER} Beta AS`,
    `${NAME_MARKER} Gamma AS`,
    `${NAME_MARKER} Delta AS`,
] as const

const companyIds: Record<string, number> = {}

async function createCompany(name: string) {
    const company = await prisma.company.create({
        data: {
            name,
            description: `${name} er en bedrift.`,
            logo: { create: {} },
        },
    })
    companyIds[name] = company.id
}

async function setSponsorTier(name: string, sponsorTier: CompanySponsorTier) {
    await companyOperations.updateSponsorTier({
        params: { id: companyIds[name] },
        data: { sponsorTier },
        bypassAuth: true,
    })
}

async function readPage(pageSize: number, page: number, cursor: { id: number } | null = null) {
    return await companyOperations.readPage({
        params: {
            paging: {
                page: { page, pageSize, cursor },
                details: { name: NAME_MARKER },
            },
        },
        bypassAuth: true,
    })
}

async function readTiers() {
    const companies = await readPage(COMPANY_NAMES.length, 0)
    return companies.map(company => [company.name, company.sponsorTier])
}

beforeAll(async () => {
    for (const name of COMPANY_NAMES) {
        await createCompany(name)
    }
})

describe('company sponsor tiers', () => {
    test('a company starts out on the ordinary tier', async () => {
        const company = await prisma.company.findUniqueOrThrow({
            where: { id: companyIds[`${NAME_MARKER} Alfa AS`] },
        })
        expect(company.sponsorTier).toBe('NONE')
    })

    test('changing the tier is not open to just anyone', async () => {
        await expect(companyOperations.updateSponsorTier({
            params: { id: companyIds[`${NAME_MARKER} Alfa AS`] },
            data: { sponsorTier: 'MAIN' },
            session: Session.empty(),
        })).rejects.toThrow(new Smorekopp('UNAUTHENTICATED'))

        const company = await prisma.company.findUniqueOrThrow({
            where: { id: companyIds[`${NAME_MARKER} Alfa AS`] },
        })
        expect(company.sponsorTier).toBe('NONE')
    })

    test('promoting a new main sponsor demotes the sitting one', async () => {
        await setSponsorTier(`${NAME_MARKER} Alfa AS`, 'MAIN')
        await setSponsorTier(`${NAME_MARKER} Beta AS`, 'MAIN')

        // Scoped to the marked companies: a seeded company could hold the main slot too.
        const companies = await prisma.company.findMany({
            where: { sponsorTier: 'MAIN', name: { contains: NAME_MARKER } },
        })
        expect(companies).toHaveLength(1)
        expect(companies[0].id).toBe(companyIds[`${NAME_MARKER} Beta AS`])

        // The company that lost the slot stays a sponsor rather than dropping out of the listing.
        const demoted = await prisma.company.findUniqueOrThrow({
            where: { id: companyIds[`${NAME_MARKER} Alfa AS`] },
        })
        expect(demoted.sponsorTier).toBe('SPONSOR')
    })

    test('the listing puts the main sponsor first, then the sponsors, then the rest', async () => {
        await setSponsorTier(`${NAME_MARKER} Alfa AS`, 'NONE')
        await setSponsorTier(`${NAME_MARKER} Beta AS`, 'SPONSOR')
        await setSponsorTier(`${NAME_MARKER} Gamma AS`, 'SPONSOR')
        await setSponsorTier(`${NAME_MARKER} Delta AS`, 'MAIN')

        expect(await readTiers()).toEqual([
            [`${NAME_MARKER} Delta AS`, 'MAIN'],
            [`${NAME_MARKER} Beta AS`, 'SPONSOR'],
            [`${NAME_MARKER} Gamma AS`, 'SPONSOR'],
            [`${NAME_MARKER} Alfa AS`, 'NONE'],
        ])
    })

    test('paging past the sponsors keeps the order', async () => {
        const firstPage = await readPage(2, 0)
        const secondPage = await readPage(2, 1, { id: firstPage[firstPage.length - 1].id })

        expect(firstPage.map(company => company.name)).toEqual([
            `${NAME_MARKER} Delta AS`,
            `${NAME_MARKER} Beta AS`,
        ])
        expect(secondPage.map(company => company.name)).toEqual([
            `${NAME_MARKER} Gamma AS`,
            `${NAME_MARKER} Alfa AS`,
        ])
    })
})

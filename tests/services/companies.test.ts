import { Session } from '@/auth/session/Session'
import { Smorekopp } from '@/services/error'
import { prisma } from '@/prisma-pn-client-instance'
import { companyOperations } from '@/services/career/companies/operations'
import { beforeAll, describe, expect, test } from '@jest/globals'
import type { CompanySponsorTier } from '@/prisma-generated-pn-types'

const COMPANY_NAMES = ['Alfa AS', 'Beta AS', 'Gamma AS', 'Delta AS'] as const

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

async function readTiers() {
    const companies = await companyOperations.readPage({
        params: {
            paging: {
                page: { page: 0, pageSize: 10, cursor: null },
                details: {},
            },
        },
        bypassAuth: true,
    })
    return companies.map(company => [company.name, company.sponsorTier])
}

beforeAll(async () => {
    for (const name of COMPANY_NAMES) {
        await createCompany(name)
    }
})

describe('company sponsor tiers', () => {
    test('a company starts out on the ordinary tier', async () => {
        const company = await prisma.company.findUniqueOrThrow({ where: { id: companyIds['Alfa AS'] } })
        expect(company.sponsorTier).toBe('NONE')
    })

    test('changing the tier is not open to just anyone', async () => {
        await expect(companyOperations.updateSponsorTier({
            params: { id: companyIds['Alfa AS'] },
            data: { sponsorTier: 'MAIN' },
            session: Session.empty(),
        })).rejects.toThrow(new Smorekopp('UNAUTHENTICATED'))

        const company = await prisma.company.findUniqueOrThrow({ where: { id: companyIds['Alfa AS'] } })
        expect(company.sponsorTier).toBe('NONE')
    })

    test('promoting a new main sponsor demotes the sitting one', async () => {
        await setSponsorTier('Alfa AS', 'MAIN')
        await setSponsorTier('Beta AS', 'MAIN')

        const companies = await prisma.company.findMany({ where: { sponsorTier: 'MAIN' } })
        expect(companies).toHaveLength(1)
        expect(companies[0].id).toBe(companyIds['Beta AS'])

        // The company that lost the slot stays a sponsor rather than dropping out of the listing.
        const demoted = await prisma.company.findUniqueOrThrow({ where: { id: companyIds['Alfa AS'] } })
        expect(demoted.sponsorTier).toBe('SPONSOR')
    })

    test('the listing puts the main sponsor first, then the sponsors, then the rest', async () => {
        await setSponsorTier('Alfa AS', 'NONE')
        await setSponsorTier('Beta AS', 'SPONSOR')
        await setSponsorTier('Gamma AS', 'SPONSOR')
        await setSponsorTier('Delta AS', 'MAIN')

        expect(await readTiers()).toEqual([
            ['Delta AS', 'MAIN'],
            ['Beta AS', 'SPONSOR'],
            ['Gamma AS', 'SPONSOR'],
            ['Alfa AS', 'NONE'],
        ])
    })

    test('paging past the sponsors keeps the order', async () => {
        const firstPage = await companyOperations.readPage({
            params: {
                paging: {
                    page: { page: 0, pageSize: 2, cursor: null },
                    details: {},
                },
            },
            bypassAuth: true,
        })
        const secondPage = await companyOperations.readPage({
            params: {
                paging: {
                    page: { page: 1, pageSize: 2, cursor: { id: firstPage[firstPage.length - 1].id } },
                    details: {},
                },
            },
            bypassAuth: true,
        })

        expect(firstPage.map(company => company.name)).toEqual(['Delta AS', 'Beta AS'])
        expect(secondPage.map(company => company.name)).toEqual(['Gamma AS', 'Alfa AS'])
    })
})

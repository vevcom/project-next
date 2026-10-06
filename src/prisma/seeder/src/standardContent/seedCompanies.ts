import { companyOperations } from '@/services/career/companies/operations'
import { defineSeedOperation } from '@/seeder/src/defineSeedOperation'
import { upsert } from '@/seeder/src/upsert'
import { getImageForCmsImageRelation } from '@/seeder/src/standardContent/seedImages'
import type { PrismaClient } from '@/prisma-generated-pn-client'
import type { ImagesAvailablieForCms } from '@/seeder/src/standardContent/seedImages'
import type { Data } from '@/services/serviceOperation'
import type { CompanySponsorTier } from '@/prisma-generated-pn-types'

type SeedCompanyConfig = Data<typeof companyOperations.create> & {
    logo: ImagesAvailablieForCms,
    // Neither field can go through companyOperations.create, so both are written right after it,
    // the same way the logo is.
    sponsor?: {
        sponsorTier: CompanySponsorTier,
        website: string | null,
    },
}

// The sponsors the site ships logos for, carrying the tiers the footer used to hardcode as two
// image slots. Extend as Bedkom signs new sponsors; job ads are written in the site, not seeded.
export const seedCompaniesConfig = [
    {
        name: 'Kongsberg Gruppen',
        description: 'Internasjonal teknologikonsern innen forsvar, maritime systemer og romfart.',
        logo: { dynamicImageSeededForCmsName: 'kongsberg' },
        sponsor: { sponsorTier: 'SPONSOR', website: 'https://www.kongsberg.com' },
    },
    {
        name: 'Nordic Semiconductor',
        description: 'Trondheimsbasert produsent av trådløse kretsløsninger for IoT.',
        logo: { dynamicImageSeededForCmsName: 'nordic' },
        sponsor: { sponsorTier: 'MAIN', website: 'https://www.nordicsemi.com' },
    },
] as const satisfies SeedCompanyConfig[]

// Keyed on the unique company name. An existing company is left untouched, since it may have been
// edited through the admin pages; the one exception is attachMissingLogo.
export const seedCompanies = defineSeedOperation(async (prisma: PrismaClient) => {
    await Promise.all(seedCompaniesConfig.map(company => upsertCompany(prisma, company)))
})

async function upsertCompany(prisma: PrismaClient, company: SeedCompanyConfig) {
    // Looked up before anything is written: companyOperations.create commits on its own, so a logo
    // that fails to resolve afterwards leaves a company every later run skips, logo pointing nowhere.
    const logo = await getImageForCmsImageRelation(company.logo, prisma)

    return upsert({
        checkExistance: () => prisma.company.findUnique({
            where: { name: company.name },
            select: { id: true },
        }),
        create: () => createCompany(prisma, company, logo.id),
        update: () => attachMissingLogo(prisma, company.name, logo.id),
    })
}

async function createCompany(prisma: PrismaClient, company: SeedCompanyConfig, imageId: number) {
    const createdCompany = await companyOperations.create({
        data: { name: company.name, description: company.description }
    })

    // create makes the logo CmsImage but cannot point it at an image, so that is connected here.
    await connectLogo(prisma, createdCompany.id, imageId)

    if (company.sponsor) {
        // Through updateSponsorTier, since another company may already hold MAIN and only that
        // operation demotes the sitting one. The website is not part of its data.
        await companyOperations.updateSponsorTier({
            params: { id: createdCompany.id },
            data: { sponsorTier: company.sponsor.sponsorTier },
        })
        await prisma.company.update({
            where: { id: createdCompany.id },
            data: { website: company.sponsor.website },
        })
    }

    return createdCompany
}

// A logo CmsImage with no image is an earlier run that died between create and connect, and nothing
// else will fill it in. One that already has an image is untouched, so admin swaps stay swapped.
async function attachMissingLogo(prisma: PrismaClient, name: string, imageId: number) {
    const existing = await prisma.company.findUniqueOrThrow({
        where: { name },
        select: { id: true, logo: { select: { imageId: true } } },
    })
    if (existing.logo.imageId !== null) return

    await connectLogo(prisma, existing.id, imageId)
}

async function connectLogo(prisma: PrismaClient, companyId: number, imageId: number) {
    await prisma.company.update({
        where: { id: companyId },
        data: {
            logo: {
                update: {
                    image: { connect: { id: imageId } }
                }
            }
        }
    })
}

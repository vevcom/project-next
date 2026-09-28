import migrateOmbul from './migrateOmbul'
import migrateImageCollections from './migrateImageCollections'
import migrateImages from './migrateImages'
import { getLimits } from './migrationLimits'
import migrateOmegaquotes from './migrateOmegaquotes'
import migrateArticles from './migateArticles'
import migrateMailAliases from './migrateMailAlias'
import migrateEvents from './migrateEvents'
import { UserMigrator } from './migrateUsers'
import migrateCommittees from './migrateCommittees'
import migrateLedgerAccounts from './migrateLedgerAccounts'
import migrateLedgerTransactions from './migrateLedgerTransactions'
import seedProdPermissions from './seedProdPermissions'
import manifest from '@/prisma/seeder/src/dobbelOmega/manifest'
import { PrismaClient as PrismaClientOw } from '@/prisma-generated-ow-basic/client'
import { PrismaPg } from '@prisma/adapter-pg'
import type { PrismaClient as PrismaClientPn } from '@/prisma-generated-pn-client'

/**
 * !DobbelOmega!
 * This function migrates data from OW basic to ProjectNext
 * @param pnPrisma - PrismaClientPn
 */
export default async function dobbelOmega(pnPrisma: PrismaClientPn) {
    manifest.info('============================================')
    manifest.info('==========!!!Dobbel Omega!!!================')
    const owPrisma = new PrismaClientOw({
        adapter: new PrismaPg({
            connectionString: process.env.OW_DB_URI,
        }),
    })

    const limits = getLimits()

    const imageCollectionIdMap = await migrateImageCollections(pnPrisma, owPrisma)
    const imageIdMap = await migrateImages(pnPrisma, owPrisma, imageCollectionIdMap, limits)

    const userMigrator = new UserMigrator(pnPrisma, owPrisma, imageIdMap)
    await userMigrator.initSpecialGroups()
    await userMigrator.migrateUsers(limits)

    await migrateOmbul(pnPrisma, owPrisma, imageIdMap, limits)
    await migrateOmegaquotes(pnPrisma, owPrisma, userMigrator, limits)
    await migrateArticles(pnPrisma, owPrisma, imageIdMap, limits)
    await migrateMailAliases(pnPrisma, owPrisma, limits)
    const committeeGroupIdMap = await migrateCommittees(pnPrisma, owPrisma, userMigrator, imageIdMap)
    const eventRegistrationIdMap = await migrateEvents(pnPrisma, owPrisma, imageIdMap, userMigrator, limits)

    const { userAccountIdMap, drainAccountIdMap, legacySuspenseAccountId } = await migrateLedgerAccounts(
        pnPrisma, owPrisma, userMigrator, committeeGroupIdMap
    )
    await migrateLedgerTransactions({
        pnPrisma, owPrisma, userAccountIdMap, drainAccountIdMap, eventRegistrationIdMap, legacySuspenseAccountId, limits
    })

    await seedProdPermissions(pnPrisma)

    owPrisma.$disconnect()
    manifest.info('=======Dobbel Omega ferdig, dagen derpå=======')
}

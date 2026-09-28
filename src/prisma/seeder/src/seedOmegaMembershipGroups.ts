import { OmegaMembershipLevel } from '@/prisma-generated-pn-types'
import type { PrismaClient } from '@/prisma-generated-pn-client'

/**
 * Upserts the one omega membership group per membership level.
 *
 * These follow omega's order, so they are always seeded into - and brought up to - the current
 * order. One left behind in an earlier order would block omega from incrementing.
 */
export default async function seedOmegaMembershipGroups(prisma: PrismaClient) {
    const { order } = await prisma.omegaOrder.findFirstOrThrow({
        orderBy: {
            order: 'desc',
        },
    })

    await Promise.all(Object.values(OmegaMembershipLevel).map(level => prisma.omegaMembershipGroup.upsert({
        where: { omegaMembershipLevel: level },
        update: {
            group: {
                update: { order },
            },
        },
        create: {
            omegaMembershipLevel: level,
            group: {
                create: {
                    groupType: 'OMEGA_MEMBERSHIP_GROUP',
                    order,
                }
            }
        }
    })))
}

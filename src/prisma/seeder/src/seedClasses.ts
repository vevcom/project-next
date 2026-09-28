import { CLASS_LEVEL_ORDERING } from '@/services/groups/constants'
import type { PrismaClient } from '@/prisma-generated-pn-client'

/**
 * Upserts the one class group per class level.
 *
 * Classes follow omega's order, so they are always seeded into - and brought up to - the current
 * order. A class group left behind in an earlier order would block omega from incrementing.
 */
export default async function seedClasses(prisma: PrismaClient) {
    const { order } = await prisma.omegaOrder.findFirstOrThrow({
        orderBy: {
            order: 'desc',
        },
    })

    await Promise.all(CLASS_LEVEL_ORDERING.map(level => prisma.class.upsert({
        where: { level },
        update: {
            group: {
                update: { order },
            },
        },
        create: {
            level,
            group: {
                create: {
                    groupType: 'CLASS',
                    order,
                },
            }
        }
    })))
}

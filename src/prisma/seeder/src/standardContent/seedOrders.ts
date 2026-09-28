import { defineSeedOperation } from '@/seeder/src/defineSeedOperation'
import type { PrismaClient } from '@/prisma-generated-pn-client'

const CURRENT_OMEGA_ORDER = 108

/**
 * Upserts every omega order up until CURRENT_OMEGA_ORDER.
 */
export const seedOrders = defineSeedOperation(async (prisma: PrismaClient) => {
    await Promise.all(
        Array.from({ length: CURRENT_OMEGA_ORDER }, (_, i) => i + 1).map(orderNumber =>
            prisma.omegaOrder.upsert({
                where: { order: orderNumber },
                create: { order: orderNumber },
                update: {},
            })
        )
    )
})

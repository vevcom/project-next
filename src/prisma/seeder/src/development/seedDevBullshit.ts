import { defineSeedOperation } from '@/seeder/src/defineSeedOperation'
import type { PrismaClient } from '@/prisma-generated-pn-client'


export const seedDevBullshit = defineSeedOperation(async (prisma: PrismaClient) => {
    const user = await prisma.user.findFirst({})
    if (!user) {
        return
    }
    await Promise.all(Array.from({ length: 100 }, (_, i) => prisma.bullshit.create({
        data: {
            quote: `Bullshit ${i + 1}`,
            bullshitPoster: {
                connect: {
                    id: user.id
                }
            },
        }
    })))
})

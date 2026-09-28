import type { PrismaClient } from '@/prisma-generated-pn-client'

const standardStudyProgrammes = [
    {
        name: 'Kybernetikk og robotikk - master (5-årig)',
        code: 'MTTK',
        yearsLength: 5,
        startYear: 1,
        partOfOmega: true,
    },
    {
        name: 'Elektronisk systemdesign og innovasjon - master (5-årig)',
        code: 'MTELSYS',
        yearsLength: 5,
        startYear: 1,
        partOfOmega: true,
    },
    {
        name: 'Kybernetikk og robotikk - master (2-årig)',
        code: 'MITK',
        yearsLength: 2,
        startYear: 4,
        partOfOmega: true,
    },
]

/**
 * Upserts the study programmes that are always expected to exist.
 *
 * Study programmes follow omega's order, so they are always seeded into - and brought up to - the
 * current order. One left behind in an earlier order would block omega from incrementing.
 */
export default async function seedStudyProgramme(prisma: PrismaClient) {
    const { order } = await prisma.omegaOrder.findFirstOrThrow({
        orderBy: {
            order: 'desc',
        },
    })

    await Promise.all(standardStudyProgrammes.map(studyProgramme => prisma.studyProgramme.upsert({
        where: { code: studyProgramme.code },
        update: {
            ...studyProgramme,
            group: {
                update: { order },
            },
        },
        create: {
            ...studyProgramme,
            group: {
                create: {
                    groupType: 'STUDY_PROGRAMME',
                    order,
                }
            }
        }
    })))
}

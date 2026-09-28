import { articleRealtionsIncluder } from '@/cms/articles/constants'
import { JobType } from '@/prisma-generated-pn-types'
import { expandedImageIncluder } from '@/services/images/subservice/constants'
import type { Prisma } from '@/prisma-generated-pn-types'


export const jobAdType = {
    FULL_TIME: { label: 'Heltid' },
    PART_TIME: { label: 'Deltid' },
    INTERNSHIP: { label: 'Internship' },
    OTHER: { label: 'Annet' },
    CONTRACT: { label: 'Kontrakt' },
} satisfies Record<JobType, { label: string }>

export const articleAndCompanyIncluder = {
    article: {
        include: articleRealtionsIncluder
    },
    company: true
} as const satisfies Prisma.JobAdInclude

export const simpleArticleAndCompanyIncluder = {
    company: {
        select: {
            name: true,
            sponsorTier: true,
        }
    },
    article: {
        include: {
            coverImage: {
                include: {
                    image: { include: expandedImageIncluder }
                }
            }
        }
    }
} as const satisfies Prisma.JobAdInclude

export const jobAdOptions = Object.values(JobType).map((opt): { value: JobType, label: string } => ({
    value: opt,
    label: jobAdType[opt].label
}))

/**
 * Job ads from sponsor companies are lifted above the rest, and are otherwise listed newest first.
 * See companySponsorOrdering for why sorting the tier ascending is what puts sponsors on top.
 */
export const activeJobAdOrdering = [
    { company: { sponsorTier: 'asc' } },
    { article: { createdAt: 'desc' } },
] as const satisfies Prisma.JobAdOrderByWithRelationInput[]

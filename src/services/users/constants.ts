import { createSelection } from '@/services/createSelection'
import { expandedImageIncluder } from '@/services/images/subservice/constants'
import type { Prisma, User, SEX } from '@/prisma-generated-pn-types'

export const maxNumberOfGroupsInFilter = 7

export const defaultSearchResultLimit = 5

// TODO: This needs to be divived into seperate filters, depending on how much information is needed
export const userFieldsToExpose = [
    'id',
    'username',
    'firstname',
    'lastname',
    'email',
    'emailVerified',
    'mobile',
    'createdAt',
    'updatedAt',
    'acceptedTerms',
    'sex',
    'allergies',
    'studentCard',
    'imageConsent',
    'relationshipStatus',
    'relationshipStatusText',
] as const satisfies (keyof User)[]

export const userFilterSelection = {
    ...createSelection([...userFieldsToExpose]),
    flairs: {
        select: {
            id: true,
            rank: true,
            colorR: true,
            colorG: true,
            colorB: true,
            image: { include: expandedImageIncluder },
        },
    },
} as const satisfies Prisma.UserSelect

export const standardMembershipSelection = [
    {
        group: {
            groupType: 'CLASS'
        }
    },
    {
        group: {
            groupType: 'OMEGA_MEMBERSHIP_GROUP'
        }
    },
    {
        group: {
            groupType: 'STUDY_PROGRAMME'
        }
    },
] satisfies Prisma.MembershipWhereInput[]


export const sexConfig = {
    MALE: {
        title: 'Broder',
        pronoun: 'Hands',
        label: 'Mann',
    },
    FEMALE: {
        title: 'Syster',
        pronoun: 'Hendes',
        label: 'Kvinne',
    },
    OTHER: {
        title: 'Sysken',
        pronoun: 'Hends',
        label: 'Annet',
    }
} as const satisfies { [key in SEX]: { title: string, pronoun: string, label: string } }

export const relationshipStatusConfig = {
    SINGLE: {
        label: 'Singel'
    },
    TAKEN: {
        label: 'I et forhold'
    },
    ITS_COMPLICATED: {
        label: 'Det er komplisert'
    },
    NOT_SPECIFIED: {
        label: 'Ikke spesifisert'
    }
}

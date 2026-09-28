import type { userFilterSelection } from './constants'
import type { userSchemas } from './schemas'
import type { MembershipFiltered } from '@/services/groups/types'
import type { InferPagingCursor, InferPagingDetails } from '@/lib/paging/schema'
import type { ClassLevel, OmegaMembershipLevel, Permission } from '@/prisma-generated-pn-types'
import type { ExpandedImage } from '@/services/images/subservice/types'
import type { Prisma } from '@/prisma-generated-pn-types'

export type UserFiltered = Prisma.UserGetPayload<{
    select: typeof userFilterSelection
}>

export type StandardMembeships = {
    class?: ClassLevel
    studyProgramme?: string
    membershipType?: OmegaMembershipLevel
}

export type UserPagingReturn = UserFiltered & StandardMembeships & {
    selectedGroupInfo?: {
        title?: string
        admin?: boolean
    }
}

/**
 * Groups is an array of group ids and order. They will be ANDed together.
 * PartOfName is a string that is part of the name of the user.
 * selectedGroup will also filter on that group, but will also return extra
 * info about that membership.
 */
export type UserDetails = InferPagingDetails<typeof userSchemas.readPage>

export type RegisterNewEmailType = {
    verified: boolean,
    email: string,
}

export type UserCursor = InferPagingCursor<typeof userSchemas.readPage>

export type Profile = {
    user: UserFiltered & { image: ExpandedImage, bio: string },
    memberships: MembershipFiltered[],
    permissions: Permission[],
}

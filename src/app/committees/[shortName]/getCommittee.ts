import { committeeOperations } from '@/services/groups/committees/operations'

/**
 * A function to get a committee from the shortName param of a page under /committees/[shortName].
 * Meant to be called from a serverPage operation (or withPageSession), which supplies the service
 * context - a missing committee throws NOT FOUND, which serverPage renders as the not-found page.
 * @param shortName - The shortName route param, still URI-encoded.
 * @returns The committee.
 */
export default async function getCommittee(shortName: string) {
    return committeeOperations.read({
        params: {
            shortName: decodeURIComponent(shortName),
        },
    })
}

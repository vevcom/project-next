import type { Prisma } from '@/prisma-generated-pn-client'

export type LedgerAccountOwnership = {
    userId: number | null,
    groupIds: number[],
}

/**
 * Resolves the owning user and owning groups of one ledger account, for authorizers to check
 * access against. Skips the database when only `userId` is given, since that ID is itself the
 * ownership fact.
 *
 * @warning Does not confirm the account exists. Returns empty ownership if it doesn't. Callers
 * that need existence checked must still use `ledgerAccountOperations.read` themselves.
 */
export async function resolveAccountOwnership(
    prisma: Prisma.TransactionClient,
    params: { userId?: number, ledgerAccountId?: number },
): Promise<LedgerAccountOwnership> {
    if (params.ledgerAccountId === undefined) {
        return { userId: params.userId ?? null, groupIds: [] }
    }

    const account = await prisma.ledgerAccount.findUnique({
        where: { id: params.ledgerAccountId },
        select: { user: { select: { id: true } }, groups: { select: { groupId: true } } },
    })

    return {
        userId: account?.user?.id ?? null,
        groupIds: account?.groups.map(group => group.groupId) ?? [],
    }
}

/**
 * Same as {@link resolveAccountOwnership}, for a batch of accounts matching any of
 * `ledgerAccountIds`, `userIds` or `groupIds`.
 */
export async function resolveAccountsOwnership(
    prisma: Prisma.TransactionClient,
    params: { ledgerAccountIds?: number[], userIds?: number[], groupIds?: number[] },
): Promise<LedgerAccountOwnership[]> {
    const ownerships: LedgerAccountOwnership[] = [
        ...(params.userIds ?? []).map(userId => ({ userId, groupIds: [] as number[] })),
        ...(params.groupIds ?? []).map(groupId => ({ userId: null, groupIds: [groupId] })),
    ]

    if (params.ledgerAccountIds?.length) {
        const accounts = await prisma.ledgerAccount.findMany({
            where: { id: { in: params.ledgerAccountIds } },
            select: { user: { select: { id: true } }, groups: { select: { groupId: true } } },
        })

        ownerships.push(...accounts.map(account => ({
            userId: account.user?.id ?? null,
            groupIds: account.groups.map(group => group.groupId),
        })))
    }

    return ownerships
}

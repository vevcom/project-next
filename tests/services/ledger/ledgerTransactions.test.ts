import { allSettledOrThrow, recordSentMail } from 'tests/utils'
import { prisma } from '@/prisma/client'
import { ledgerAccountOperations } from '@/services/ledger/accounts/operations'
import { userOperations } from '@/services/users/operations'
import { paymentOperations } from '@/services/ledger/payments/operations'
import { ledgerTransactionOperations } from '@/services/ledger/transactions/operations'
import { defineOperation } from '@/services/serviceOperation'
import { Require } from '@/auth/authorizer/Require'
import { beforeAll, beforeEach, afterEach, describe, expect, test } from '@jest/globals'
import { z } from 'zod'
import { randomUUID } from 'crypto'

const TEST_ACCOUNT_COUNT = 3
const INITIAL_BALANCE = { amount: 100_00, fees: 10_00 }

describe('ledger transactions', () => {
    const testAccountIds: number[] = []

    // Set up ledger accounts
    beforeAll(async () => {
        // TODO: Create utility to create test accounts
        await allSettledOrThrow(Array.from({ length: TEST_ACCOUNT_COUNT }).map(async (_, i) => {
            const username = `testuser${i + 1}`

            const testUser = await userOperations.create({
                data: {
                    email: `${username}@example.com`,
                    firstname: 'Test',
                    lastname: 'User',
                    username,
                },
                bypassAuth: true,
            })

            // userOperations.create already gave the user a ledger account - just read it.
            const testAccount = await ledgerAccountOperations.read({
                params: { userId: testUser.id },
                bypassAuth: true,
            })

            testAccountIds.push(testAccount.id)
        }))
    })

    afterEach(async () => {
        await prisma.ledgerEntry.deleteMany({})
        await prisma.ledgerTransaction.deleteMany({})
    })

    describe('external transactions', () => {

    })

    describe('internal transactions', () => {
        beforeEach(async () => {
            await allSettledOrThrow(testAccountIds.map(async accountId => {
                const manualPayment = await paymentOperations.create({
                    params: {
                        funds: INITIAL_BALANCE.amount,
                        provider: 'MANUAL',
                        manualFees: INITIAL_BALANCE.fees,
                    },
                    bypassAuth: true,
                })

                await ledgerTransactionOperations.create({
                    params: {
                        purpose: 'DEPOSIT',
                        ledgerEntries: [{
                            ledgerAccountId: accountId,
                            funds: INITIAL_BALANCE.amount,
                        }],
                        paymentId: manualPayment.id,
                    },
                    bypassAuth: true,
                })
            })
            )
        })

        const validLedgerEntries: number[][] = [
            // No entries
            [],
            // Transfer between two accounts
            [100_00, -100_00],
            // Transfer between three accounts - two debits and one credit
            [100_00, -50_00, -50_00],
            // Transfer between three accounts - two credits and one debit
            [-100_00, 50_00, 50_00],
        ]

        test.each(validLedgerEntries)('valid internal transactions', async (...entries) => {
            const transaction = await ledgerTransactionOperations.create({
                params: {
                    ledgerEntries: entries.map((funds, i) => ({ funds, ledgerAccountId: testAccountIds[i] })),
                    purpose: 'DEPOSIT',
                },
                bypassAuth: true,
            })

            expect(transaction).toMatchObject({
                state: 'SUCCEEDED',
            })

            const balances = await ledgerAccountOperations.calculateBalances({
                params: { ledgerAccountIds: testAccountIds },
                bypassAuth: true,
            })

            entries.forEach((amount, i) => {
                const accountId = testAccountIds[i]
                const balance = balances[accountId]

                expect(balance.amount).toBe(INITIAL_BALANCE.amount + amount)
            })
        })

        const invalidLedgerEntries: number[][] = [
            // Only one entry
            [100],
            [-100],
            // Non-zero sum
            [100_00, -99_00],
            [-1919, 1000_00],
            [100_00, -50_00, -50_01],
        ]

        test.each(invalidLedgerEntries)('invalid internal transactions', async (...entries) => {
            const transactionPromise = ledgerTransactionOperations.create({
                params: {
                    ledgerEntries: entries.map((funds, i) => ({ funds, ledgerAccountId: testAccountIds[i] })),
                    purpose: 'DEPOSIT',
                },
                bypassAuth: true,
            })

            await expect(transactionPromise).rejects.toThrow()

            const balances = await ledgerAccountOperations.calculateBalances({
                params: { ledgerAccountIds: testAccountIds },
                bypassAuth: true,
            })

            testAccountIds.forEach(accountId => {
                const balance = balances[accountId]

                expect(balance.amount).toBe(INITIAL_BALANCE.amount)
            })
        })
    })

    // Paying for the cabin booking of a guest is confirmed by mail, which is what the side
    // effects of the completion hook are observed through.
    describe('payment completion', () => {
        const guestEmail = 'guest@example.com'
        let sentMail: ReturnType<typeof recordSentMail>

        async function createGuestBooking() {
            return await prisma.booking.create({
                data: {
                    type: 'CABIN',
                    start: new Date('2030-01-01'),
                    end: new Date('2030-01-03'),
                    numberOfMembers: 0,
                    numberOfNonMembers: 0,
                    secret: randomUUID(),
                    transactionTimeout: new Date(Date.now() + 10 * 60 * 1000),
                    guestUser: {
                        create: { firstname: 'Test', lastname: 'Guest', email: guestEmail, mobile: '12345678' },
                    },
                },
            })
        }

        const payForBooking = defineOperation({
            authorizer: () => Require.nothing(),
            paramsSchema: z.object({ bookingId: z.number(), rollBack: z.boolean() }),
            opensTransaction: true,
            operation: async ({ params }) => prisma.$transaction(async tx => {
                const transaction = await ledgerTransactionOperations.create({
                    params: { purpose: 'CABIN_BOOKING', ledgerEntries: [], bookingId: params.bookingId },
                    prisma: tx,
                    bypassAuth: true,
                })

                expect(transaction.state).toBe('SUCCEEDED')
                expect(sentMail).not.toHaveBeenCalled()

                if (params.rollBack) throw new Error('Rolled back')
            }),
        })

        beforeEach(() => {
            sentMail = recordSentMail()
        })

        test('confirms the booking once the payment has committed', async () => {
            const booking = await createGuestBooking()

            await payForBooking({ params: { bookingId: booking.id, rollBack: false } })

            expect(sentMail).toHaveBeenCalledTimes(1)
            expect(sentMail).toHaveBeenCalledWith(expect.objectContaining({ to: guestEmail }))
            const paidBooking = await prisma.booking.findUniqueOrThrow({ where: { id: booking.id } })
            expect(paidBooking.transactionTimeout).toBeNull()
        })

        test('sends no confirmation when the payment rolls back', async () => {
            const booking = await createGuestBooking()

            await expect(payForBooking({ params: { bookingId: booking.id, rollBack: true } })).rejects.toThrow()

            expect(sentMail).not.toHaveBeenCalled()
            const unpaidBooking = await prisma.booking.findUniqueOrThrow({ where: { id: booking.id } })
            expect(unpaidBooking.transactionTimeout).not.toBeNull()
        })
    })
})

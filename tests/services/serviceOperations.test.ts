import { Require } from '@/auth/authorizer/Require'
import { Session } from '@/auth/session/Session'
import { defineOperation, runAfterCommit } from '@/services/serviceOperation'
import { prisma as globalPrisma } from '@/prisma-pn-client-instance'
import { describe, expect, test } from '@jest/globals'
import { z } from 'zod'

describe('service operation', () => {
    describe('simple', () => {
        const addPositiveOnly = defineOperation({
            authorizer: ({ data: { a, b } }) => {
                if (a < 0 || b < 0) {
                    // The bare `Require` entry point has no rules chained onto it, so it always denies.
                    return Require
                }

                return Require.nothing()
            },
            dataSchema: z.object({
                a: z.number(),
                b: z.number(),
            }),
            operation: ({ data: { a, b } }) => a + b,
        })

        test('method result', async () => {
            const res = await addPositiveOnly({
                data: {
                    a: 1,
                    b: 2,
                },
            })

            expect(res).toBe(3)
        })

        test('auth fail', async () => {
            await expect(addPositiveOnly({
                data: {
                    a: -1,
                    b: 2,
                },
            })).rejects.toThrow()
        })

        test('bypass auth', async () => {
            const res = await addPositiveOnly({
                data: {
                    a: -1,
                    b: 2,
                },
                bypassAuth: true,
            })

            expect(res).toBe(1)
        })
    })

    describe('nested', () => {
        // Simple service operation that just returns its own context
        const inner = defineOperation({
            authorizer: () => Require.nothing(),
            operation: async (context) => context,
        })

        // Outer service operation that calls the inner one and returns its context
        const outer = defineOperation({
            authorizer: () => Require.nothing(),
            operation: async () => await inner({}),
        })

        test('nested context global defaults', async () => {
            const res = await outer({})

            expect(res.bypassAuth).toBe(false)
            expect(res.session).toBeInstanceOf(Session)
            expect(res.prisma).toBe(globalPrisma)
        })

        test('nested context override bypassAuth', async () => {
            const res = await outer({ bypassAuth: true })

            expect(res.bypassAuth).toBe(true)
            expect(res.session).toBeInstanceOf(Session)
            expect(res.prisma).toBe(globalPrisma)
        })

        test('nested context override session', async () => {
            const customSession = Session.fromJsObject({
                apiKeyId: 1919,
                memberships: [],
                permissions: [],
                user: null,
            })

            const res = await outer({ session: customSession })

            expect(res.bypassAuth).toBe(false)
            expect(res.session).toBe(customSession)
            expect(res.prisma).toBe(globalPrisma)
        })

        test('nested context override prisma', async () => {
            await globalPrisma.$transaction(async (tx) => {
                const res = await outer({ prisma: tx })

                expect(res.bypassAuth).toBe(false)
                expect(res.session).toBeInstanceOf(Session)
                expect(res.prisma).toBe(tx)
            })
        })
    })

    describe('after commit', () => {
        /**
         * An operation opening a transaction that defers an effect from inside it, logging the
         * order things happen in.
         */
        function deferringOperation(log: string[], effect: () => Promise<void>, { rollBack }: { rollBack: boolean }) {
            return defineOperation({
                authorizer: () => Require.nothing(),
                opensTransaction: true,
                operation: async ({ prisma }) => {
                    await prisma.$transaction(async tx => {
                        await runAfterCommit(tx, effect)
                        log.push('transaction body')
                        if (rollBack) throw new Error('Rolled back')
                    })
                    log.push('committed')
                },
            })
        }

        test('defers an effect until the transaction has committed', async () => {
            const log: string[] = []
            await deferringOperation(log, async () => { log.push('effect') }, { rollBack: false })({})

            expect(log).toEqual(['transaction body', 'committed', 'effect'])
        })

        test('drops a deferred effect when the transaction rolls back', async () => {
            const log: string[] = []
            await expect(
                deferringOperation(log, async () => { log.push('effect') }, { rollBack: true })({})
            ).rejects.toThrow()

            expect(log).toEqual(['transaction body'])
        })

        test('a failing deferred effect does not fail the committed operation', async () => {
            const log: string[] = []
            await deferringOperation(log, async () => {
                throw new Error('Effect failed')
            }, { rollBack: false })({})

            expect(log).toEqual(['transaction body', 'committed'])
        })

        test('runs an effect right away outside a transaction', async () => {
            const log: string[] = []
            await runAfterCommit(globalPrisma, async () => { log.push('effect') })
            log.push('after')

            expect(log).toEqual(['effect', 'after'])
        })

        test('refuses to defer from a transaction no operation declaring opensTransaction opened', async () => {
            await expect(globalPrisma.$transaction(
                async tx => runAfterCommit(tx, async () => {})
            )).rejects.toThrow()
        })
    })
})

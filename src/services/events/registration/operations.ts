import '@pn-server-only'
import {
    eventRegistrationAttendanceSelection,
    eventRegistrationSelectionDetailed,
    eventRegistrationQueueOrder,
    eventRegistrationSelection,
    REGISTRATION_READER_TYPE,
} from './constants'
import { eventRegistrationAuth } from './auth'
import { eventRegistrationSchemas } from './schemas'
import { dotOperations } from '@/services/dots/operations'
import { displayDate } from '@/lib/dates/displayDate'
import { Smorekopp } from '@/services/error'
import { standardImageCollectionOperations } from '@/services/images/standard/operations'
import { notificationOperations } from '@/services/notifications/operations'
import { sendMailOperations } from '@/services/notifications/send-mail/operations'
import { eventOperations } from '@/services/events/operations'
import { checkVisibility } from '@/auth/visibility/checkVisibility'
import { defineOperation, defineSubOperation, type PrismaPossibleTransaction } from '@/services/serviceOperation'
import { cursorPagingSelection } from '@/lib/paging/cursorPagingSelection'
import { paymentOperations } from '@/services/ledger/payments/operations'
import { ledgerTransactionOperations } from '@/services/ledger/transactions/operations'
import { stalePendingTransactionMs } from '@/services/ledger/transactions/constants'
import { ledgerAccountOperations } from '@/services/ledger/accounts/operations'
import { PaymentProvider } from '@/prisma-generated-pn-types'
import { z } from 'zod'
import type { SessionMaybeUser } from '@/auth/session/Session'
import type { Prisma } from '@/prisma-generated-pn-types'
import type { ExpandedPayment } from '@/services/ledger/payments/types'
import type { ExpandedLedgerTransaction } from '@/services/ledger/transactions/types'
import type {
    DotPunishment,
    EventAttendanceCounts,
    EventAttendanceScan,
    EventAttendanceRegistration,
    EventRegistrationExpanded,
    EventRegistrationPageDetails,
    EventRegistrationWithWaitingList,
} from './types'

/**
 * The visibility levels of one event - the regular level is what it takes to register for it, the
 * admin level what it takes to act on the registrations of everyone else.
 */
async function eventVisibility(prisma: PrismaPossibleTransaction<false>, eventId: number) {
    return await eventOperations.visibility.readDoubleLevelMatrixInternal({
        params: { id: eventId },
        prisma,
    })
}

/**
 * Whether the session administrates one event - what lets it register people outside the
 * registration window, past their dots, and unregister them after the deadline. The admin level of
 * the event grants this, and EVENT_ADMIN administrates every event.
 */
async function sessionAdministratesEvent(
    prisma: PrismaPossibleTransaction<false>,
    session: SessionMaybeUser,
    eventId: number
) {
    if (session.permissions.includes('EVENT_ADMIN')) return true
    return checkVisibility(session.memberships, (await eventVisibility(prisma, eventId)).adminLevel)
}

/**
 * The same levels for the event one registration belongs to, together with the user that owns the
 * registration - null for a guest registered by an administrator.
 */
async function registrationOwnerAndEventVisibility(
    prisma: PrismaPossibleTransaction<false>,
    registrationId: number
) {
    const registration = await prisma.eventRegistration.findUniqueOrThrow({
        where: { id: registrationId },
        select: { userId: true, eventId: true },
    })
    return {
        userId: registration.userId,
        doubleLevelMatrix: await eventVisibility(prisma, registration.eventId),
    }
}

/**
 * What the dots of a user hold them back from when registering to an event.
 */
const readDotPunishmentOfUser = defineSubOperation({
    paramsSchema: () => z.object({ userId: z.number().min(0) }),
    operation: () => async ({ prisma, params }): Promise<DotPunishment> => {
        const dots = await dotOperations.internal.numberOfActiveDotsForUser.internalCall({
            params,
            prisma,
        })

        if (dots >= 5) return { type: 'ban' }
        if (dots >= 4) return { type: 'timeout', punishmentMinutes: 24 * 60 }
        if (dots >= 3) return { type: 'timeout', punishmentMinutes: 3 * 60 }
        if (dots >= 2) return { type: 'timeout', punishmentMinutes: 10 }
        return { type: 'none' }
    }
})

/**
 * Checks the dots of the user registering: dots either hold the user back until a while after the
 * ordinary registration start of the event, or ban them from registering at all.
 *
 * @param registrationStart - The ordinary registration start of the event. A timeout counts from it.
 * @param userId - The user being registered.
 * @param isAdmin - Admins register on behalf of others, and are not held back by the dots of anyone.
 */
async function validateDotPunishmentOfRegistration(
    prisma: Prisma.TransactionClient,
    registrationStart: Date,
    userId: number,
    isAdmin: boolean
) {
    if (isAdmin) return

    const punishment = await readDotPunishmentOfUser.internalCall({
        params: { userId },
        prisma,
    })

    if (punishment.type === 'ban') {
        throw new Smorekopp('BAD PARAMETERS', 'Du har for mange prikker til å melde deg på arrangementer.')
    }

    if (punishment.type === 'none') return

    const startForUser = new Date(registrationStart.getTime() + punishment.punishmentMinutes * 60 * 1000)

    if (startForUser > new Date()) {
        throw new Smorekopp(
            'BAD PARAMETERS',
            `Du har prikker, og kan derfor først melde deg på ${displayDate(startForUser)}.`
        )
    }
}

/**
 * The id of the first registration queueing past the places of an event, or null when nobody is.
 * The queue is ordered by id, so this one id splits it: below it took a place, from it on is the
 * waiting list.
 */
async function firstOnWaitingList(
    prisma: PrismaPossibleTransaction<false>,
    eventId: number
): Promise<number | null> {
    const { places } = await prisma.event.findUniqueOrThrow({
        where: { id: eventId },
        select: { places: true },
    })

    const first = await prisma.eventRegistration.findFirst({
        where: { eventId },
        orderBy: eventRegistrationQueueOrder,
        skip: places,
        select: { id: true },
    })

    return first?.id ?? null
}

/**
 * How many of the ones registered for an event have had attendance taken for them. The ones that
 * took the places of the event are counted apart from the ones queueing past them, over the same
 * boundary the registration lists are split on - see `EventAttendanceCounts` for why.
 */
async function countAttendance(
    prisma: PrismaPossibleTransaction<false>,
    eventId: number
): Promise<EventAttendanceCounts> {
    const boundary = await firstOnWaitingList(prisma, eventId)
    const onThePlaces = boundary ? { eventId, id: { lt: boundary } } : { eventId }

    const [attended, total, attendedFromWaitingList] = await Promise.all([
        prisma.eventRegistration.count({ where: { ...onThePlaces, attendedAt: { not: null } } }),
        prisma.eventRegistration.count({ where: onThePlaces }),
        boundary
            ? prisma.eventRegistration.count({
                where: { eventId, id: { gte: boundary }, attendedAt: { not: null } },
            })
            : 0,
    ])

    return { attended, total, attendedFromWaitingList }
}

/**
 * Writes attendance for one registration: taking it stamps the moment and the one taking it,
 * clearing it drops both.
 */
async function writeAttendance(
    prisma: PrismaPossibleTransaction<false>,
    registrationId: number,
    attended: boolean,
    registeredById: number | undefined
) {
    return await prisma.eventRegistration.update({
        where: {
            id: registrationId,
        },
        data: attended
            ? { attendedAt: new Date(), attendanceRegisteredById: registeredById ?? null }
            : { attendedAt: null, attendanceRegisteredById: null },
        select: eventRegistrationAttendanceSelection,
    })
}

export const eventRegistrationOperations = {
    create: defineOperation({
        paramsSchema: z.object({
            userId: z.number().min(0),
            eventId: z.number().min(0),
        }),
        authorizer: async ({ params, prisma }) => eventRegistrationAuth.create({
            userId: params.userId,
            doubleLevelMatrix: await eventVisibility(prisma, params.eventId),
        }),
        opensTransaction: true,
        operation: async ({ prisma, params, session }): Promise<EventRegistrationWithWaitingList> => {
            const isAdmin = await sessionAdministratesEvent(prisma, session, params.eventId)
            const event = await preValidateRegistration(prisma, params.eventId, isAdmin)

            await validateDotPunishmentOfRegistration(prisma, event.registrationStart, params.userId, isAdmin)

            const registration = await prisma.eventRegistration.create({
                data: {
                    user: {
                        connect: {
                            id: params.userId,
                        },
                    },
                    event: {
                        connect: {
                            id: params.eventId,
                        },
                    },
                },
            })

            const updatedEvent = await postValidateRegistration(prisma, registration.id, params.eventId)

            return {
                ...registration,
                onWaitingList: updatedEvent.places < updatedEvent._count.eventRegistrations,
            }
        },
    }),

    createGuest: defineOperation({
        authorizer: async ({ params, prisma }) => eventRegistrationAuth.createGuest.data({
            visibility: await eventVisibility(prisma, params.eventId)
        }),
        paramsSchema: z.object({
            eventId: z.number(),
        }),
        dataSchema: eventRegistrationSchemas.createGuest,
        opensTransaction: true,
        operation: async ({ prisma, params, data }): Promise<EventRegistrationWithWaitingList> => {
            await preValidateRegistration(prisma, params.eventId, true)
            const registration = await prisma.eventRegistration.create({
                data: {
                    event: {
                        connect: {
                            id: params.eventId,
                        },
                    },
                    note: data.note,
                    contact: {
                        create: {
                            name: data.name,
                        },
                    },
                },
            })

            const updatedEvent = await postValidateRegistration(prisma, registration.id, params.eventId)

            return {
                ...registration,
                onWaitingList: updatedEvent.places < updatedEvent._count.eventRegistrations,
            }
        },
    }),

    readDotPunishmentOfUser: readDotPunishmentOfUser.implement({
        authorizer: ({ params }) => eventRegistrationAuth.readDotPunishmentOfUser.data({ userId: params.userId }),
        ownershipCheck: () => true,
    }),

    /**
     * The registration of one user to one event, or null if that user is not registered. Tells
     * whether the registration landed on the waiting list, so the one registered can be shown where
     * they stand.
     */
    readOfUser: defineOperation({
        authorizer: async ({ params, prisma }) => eventRegistrationAuth.readOfUser({
            userId: params.userId,
            doubleLevelMatrix: await eventVisibility(prisma, params.eventId),
        }),
        paramsSchema: z.object({
            eventId: z.number().min(0),
            userId: z.number().min(0),
        }),
        operation: async (
            { prisma, params }
        ): Promise<(EventRegistrationWithWaitingList & { ledgerTransactions: { id: number }[] }) | null> => {
            const event = await prisma.event.findUniqueOrThrow({
                where: {
                    id: params.eventId,
                },
                select: {
                    places: true,
                    eventRegistrations: {
                        orderBy: eventRegistrationQueueOrder,
                        include: {
                            // Only need to know whether a successful payment exists, to gate the
                            // "pay for registration" UI once it's already been paid for.
                            ledgerTransactions: {
                                where: { state: 'SUCCEEDED' },
                                select: { id: true },
                            },
                        },
                    },
                },
            })

            const queuePosition = event.eventRegistrations.findIndex(
                registration => registration.userId === params.userId
            )

            if (queuePosition === -1) return null

            return {
                ...event.eventRegistrations[queuePosition],
                onWaitingList: queuePosition >= event.places,
            }
        },
    }),

    readPage: defineOperation({
        authorizer: async ({ params, prisma }) => eventRegistrationAuth.readPage.data({
            visibility: await eventVisibility(prisma, params.paging.details.eventId)
        }),
        paramsSchema: eventRegistrationSchemas.readPage,
        operation: async ({ prisma, params }): Promise<EventRegistrationExpanded[]> => {
            const segment = await queueSegmentFilter(prisma, params.paging.details)
            if (!segment) return []

            const defaultImage = await standardImageCollectionOperations.readStandardImage({
                params: { standardImage: 'DEFAULT_PROFILE_IMAGE' },
            })

            const registrations = await prisma.eventRegistration.findMany({
                ...cursorPagingSelection(params.paging.page),
                where: segment,
                orderBy: eventRegistrationQueueOrder,
                select: eventRegistrationSelection,
            })

            return registrations.map(registration => ({
                ...registration,
                image: registration.user?.image || defaultImage,
            }))
        },
    }),

    readPageDetailed: defineOperation({
        authorizer: async ({ params, prisma }) => eventRegistrationAuth.readPageDetailed.data({
            visibility: await eventVisibility(prisma, params.paging.details.eventId)
        }),
        paramsSchema: eventRegistrationSchemas.readPageDetailed,
        operation: async ({ prisma, params }) => {
            const segment = await queueSegmentFilter(prisma, params.paging.details)
            if (!segment) return []

            return await prisma.eventRegistration.findMany({
                ...cursorPagingSelection(params.paging.page),
                where: segment,
                orderBy: eventRegistrationQueueOrder,
                select: eventRegistrationSelectionDetailed,
            })
        }
    }),

    updateNotes: defineOperation({
        authorizer: async ({ params, prisma }) => eventRegistrationAuth.updateNotes(
            await registrationOwnerAndEventVisibility(prisma, params.registrationId)
        ),
        paramsSchema: z.object({
            registrationId: z.number().min(0),
        }),
        dataSchema: eventRegistrationSchemas.updateNotes,
        operation: async ({ prisma, params, data }) => {
            const registration = await prisma.eventRegistration.findUniqueOrThrow({
                where: {
                    id: params.registrationId,
                },
                select: {
                    event: true,
                },
            })

            if (registration.event.registrationEnd < new Date()) {
                throw new Smorekopp('BAD PARAMETERS', 'Kan ikke endre påmelding etter påmeldingsfristen.')
            }

            return await prisma.eventRegistration.update({
                where: {
                    id: params.registrationId,
                },
                data: {
                    note: data.note,
                },
            })
        }
    }),

    destroy: defineOperation({
        authorizer: async ({ params, prisma }) => eventRegistrationAuth.destroy(
            await registrationOwnerAndEventVisibility(prisma, params.registrationId)
        ),
        paramsSchema: z.object({
            registrationId: z.number().min(0),
        }),
        operation: async ({ prisma, params, session }) => {
            const registration = await prisma.eventRegistration.findUniqueOrThrow({
                where: {
                    id: params.registrationId,
                },
                select: {
                    event: {
                        include: {
                            _count: {
                                select: {
                                    eventRegistrations: true,
                                },
                            },
                            eventRegistrations: {
                                orderBy: eventRegistrationQueueOrder,
                                select: {
                                    id: true,
                                },
                            }
                        }
                    },
                    userId: true,
                },
            })

            const isAdmin = await sessionAdministratesEvent(prisma, session, registration.event.id)

            if (registration.event.registrationEnd < new Date() && !isAdmin) {
                throw new Smorekopp(
                    'BAD PARAMETERS',
                    'Kan ikke avregistrere etter påmeldingsfristen. Ta kontakt med de som arrangerer.'
                )
            }

            await prisma.eventRegistration.delete({
                where: {
                    id: params.registrationId,
                },
            })

            // FIXME: there is potentially a race contidition,
            // where a person is added to the waiting list,
            // after the event was fetched, and before the registration was deleted.
            // I this a OCC can be a solution, with a version number on the event.
            if (registration.event._count.eventRegistrations <= registration.event.places ||
                registration.event.eventRegistrations
                    .map(reg => reg.id)
                    .indexOf(params.registrationId) >= registration.event.places
            ) {
                return
            }

            const nextInLine = await prisma.eventRegistration.findFirst({
                where: {
                    eventId: registration.event.id,
                },
                skip: registration.event.places - 1,
                orderBy: eventRegistrationQueueOrder,
                include: {
                    contact: true,
                }
            })

            if (!nextInLine) return

            const title = 'Opprykk fra venteliste ved Omegas nettsider'
            const message = `Gratulerer! Du har rykket opp fra venteliste på arrangementet ${registration.event.name}.`

            if (nextInLine.userId !== null) {
                await notificationOperations.createSpecial.internalCall({
                    params: {
                        special: 'EVENT_WAITINGLIST_PROMOTION',
                    },
                    data: {
                        title,
                        message,
                        targetUserIds: [nextInLine.userId],
                    },
                })
            }

            if (nextInLine.contact && nextInLine.contact.email) {
                await sendMailOperations.internal.sendSystemMail.internalCall({
                    data: {
                        to: nextInLine.contact.email,
                        subject: title,
                        body: message,
                    },
                })
            }
        }
    }),

    /**
     * Takes attendance for the user behind one Omega-ID, which is what the QR scanner at the door
     * calls. Someone who is not registered is turned away rather than registered on the spot:
     * registering is `create`'s business, and it has a queue, a deadline and dots to weigh that
     * taking attendance knows nothing about.
     *
     * Scanning the same Omega-ID twice leaves the first scan standing - when they showed up, and
     * who let them in, is the record worth keeping - and says so in `alreadyAttended`.
     */
    registerAttendance: defineOperation({
        paramsSchema: z.object({
            eventId: z.number().min(0),
            userId: z.number().min(0),
        }),
        authorizer: async ({ params, prisma }) => eventRegistrationAuth.registerAttendance.data({
            visibility: await eventVisibility(prisma, params.eventId),
        }),
        operation: async ({ prisma, params, session }): Promise<EventAttendanceScan> => {
            const existing = await prisma.eventRegistration.findUnique({
                where: {
                    eventId_userId: {
                        eventId: params.eventId,
                        userId: params.userId,
                    },
                },
                select: {
                    id: true,
                    attendedAt: true,
                },
            })

            if (!existing) {
                throw new Smorekopp('NOT FOUND', 'Denne brukeren er ikke påmeldt arrangementet.')
            }

            const registration = existing.attendedAt
                ? await prisma.eventRegistration.findUniqueOrThrow({
                    where: { id: existing.id },
                    select: eventRegistrationAttendanceSelection,
                })
                : await writeAttendance(prisma, existing.id, true, session.user?.id)

            return {
                registration,
                counts: await countAttendance(prisma, params.eventId),
                alreadyAttended: Boolean(existing.attendedAt),
            }
        },
    }),

    /**
     * Sets attendance for one registration by hand. A guest has no Omega-ID to scan, so this is the
     * only way to mark them, and it is also how a scan is taken back when the wrong person was
     * marked - clearing it drops who took it with it, since there is no longer anything they took.
     */
    setAttendance: defineOperation({
        paramsSchema: z.object({
            registrationId: z.number().min(0),
        }),
        dataSchema: eventRegistrationSchemas.setAttendance,
        authorizer: async ({ params, prisma }) => eventRegistrationAuth.setAttendance.data({
            visibility: (await registrationOwnerAndEventVisibility(prisma, params.registrationId)).doubleLevelMatrix,
        }),
        operation: async ({ prisma, params, data, session }): Promise<EventAttendanceRegistration> =>
            await writeAttendance(prisma, params.registrationId, data.attended, session.user?.id),
    }),

    /**
     * How many of the ones registered have been marked as having shown up. Read by the tools at the
     * door to show the tally, and the number the dots for not showing up will later be drawn from.
     */
    readAttendanceCounts: defineOperation({
        paramsSchema: z.object({
            eventId: z.number().min(0),
        }),
        authorizer: async ({ params, prisma }) => eventRegistrationAuth.readAttendanceCounts.data({
            visibility: await eventVisibility(prisma, params.eventId),
        }),
        operation: async ({ prisma, params }): Promise<EventAttendanceCounts> =>
            await countAttendance(prisma, params.eventId),
    }),

    /**
     * Pays for a registration created separately via `create`/`createGuest`. Never creates a
     * registration itself. Supports paying part of the price from the payer's own ledger
     * balance (`amountFromBalance`) and the rest (`shortfall`) via `provider`; `provider` is
     * only required when the balance doesn't cover the full price.
     */
    createPayment: defineOperation({
        paramsSchema: z.object({
            userId: z.number().min(0),
            eventId: z.number().min(0),
            provider: z.nativeEnum(PaymentProvider).optional(),
            amountFromBalance: z.coerce.number().nonnegative().default(0),
            manualFees: z.coerce.number().nonnegative().default(0),
            description: z.string().optional(),
        }),
        authorizer: ({ params }) => eventRegistrationAuth.createPayment.data({ userId: params.userId }),
        opensTransaction: true,
        operation: async ({ prisma, params }): Promise<{ payment: ExpandedPayment | null }> => {
            const registration = await prisma.eventRegistration.findUnique({
                where: {
                    eventId_userId: {
                        eventId: params.eventId,
                        userId: params.userId,
                    },
                },
                include: {
                    event: {
                        include: {
                            hostedByCommitee: true,
                        },
                    },
                },
            })

            if (!registration) {
                throw new Smorekopp('NOT FOUND', 'Fant ingen påmelding å betale for.')
            }

            const { event } = registration

            if (!event.price) {
                throw new Smorekopp('BAD PARAMETERS', 'Dette arrangementet krever ikke betaling.')
            }

            const now = new Date()
            if (!event.paymentStart || !event.paymentEnd || now < event.paymentStart || now > event.paymentEnd) {
                throw new Smorekopp('BAD PARAMETERS', 'Betalingsperioden for dette arrangementet er ikke åpen.')
            }

            if (!event.hostedByCommitee) {
                throw new Smorekopp('SERVER ERROR', 'Arrangementet har ingen tilknyttet komité å betale til.')
            }

            // Crediting the destination account needs no ownership over it, only reading it -
            // bypassed since the payer (our caller) is neither its owner nor LEDGER_ADMIN.
            const [destinationAccount] = await ledgerAccountOperations.readMany({
                params: { groupIds: [event.hostedByCommitee.groupId] },
                bypassAuth: true,
            })
            if (!destinationAccount) {
                throw new Smorekopp('SERVER ERROR', 'Komiteen som arrangerer har ingen tilknyttet konto.')
            }

            const funds = event.price
            if (params.amountFromBalance > funds) {
                throw new Smorekopp('BAD PARAMETERS', 'Beløpet fra kontosaldo kan ikke overstige prisen.')
            }
            const shortfall = funds - params.amountFromBalance

            if (shortfall > 0 && !params.provider) {
                throw new Smorekopp('BAD PARAMETERS', 'Betalingsmetode må oppgis.')
            }

            const transaction: ExpandedLedgerTransaction = await prisma.$transaction(async tx => {
                // Locks the registration row so concurrent payment attempts for it serialize
                // instead of racing the existingAttempt check below.
                await tx.$queryRaw`SELECT id FROM "EventRegistration" WHERE id = ${registration.id} FOR UPDATE`

                const existingAttempt = await tx.ledgerTransaction.findFirst({
                    where: {
                        eventRegistrationId: registration.id,
                        state: { in: ['PENDING', 'SUCCEEDED'] },
                    },
                })
                if (existingAttempt?.state === 'SUCCEEDED') {
                    throw new Smorekopp('BAD PARAMETERS', 'Denne påmeldingen er allerede betalt.')
                }
                if (existingAttempt) {
                    const isStale = Date.now() - existingAttempt.createdAt.getTime() > stalePendingTransactionMs
                    if (!isStale) {
                        throw new Smorekopp('BAD PARAMETERS', 'Denne påmeldingen har allerede en betaling under behandling.')
                    }
                    // Stale (likely abandoned) attempt - cancel it (also cancels any Stripe payment
                    // intent, so a late webhook for it can never complete) and let this one proceed.
                    // Bypassed: the outer authorizer already established this caller may pay for
                    // this registration, which is the right bar for canceling a stale attempt on it.
                    await ledgerTransactionOperations.cancel({
                        params: { id: existingAttempt.id },
                        bypassAuth: true,
                        prisma: tx,
                    })
                }

                let paymentId: number | undefined

                if (shortfall > 0) {
                    const payment = await paymentOperations.create({
                        params: {
                            provider: params.provider!,
                            funds: shortfall,
                            manualFees: params.manualFees,
                            descriptionLong: `Betaling for påmelding til ${event.name}`,
                            descriptionShort: 'Arrangement',
                        },
                        prisma: tx,
                    })
                    paymentId = payment.id
                }

                // Outer authorizer (eventRegistrationAuth.createPayment) already covers
                // whether this caller may pay for params.userId's registration, which
                // read's own ownership check would otherwise re-reject an admin for.
                const payerAccount = params.amountFromBalance > 0
                    ? await ledgerAccountOperations.read({
                        params: { userId: params.userId },
                        bypassAuth: true,
                        prisma: tx,
                    })
                    : undefined

                return await ledgerTransactionOperations.create({
                    params: {
                        purpose: 'EVENT_PAYMENT',
                        ledgerEntries: [
                            { ledgerAccountId: destinationAccount.id, funds },
                            ...(payerAccount
                                ? [{ ledgerAccountId: payerAccount.id, funds: -params.amountFromBalance }]
                                : []),
                        ],
                        paymentId,
                        eventRegistrationId: registration.id,
                        description: params.provider === 'MANUAL' ? params.description : undefined,
                    },
                    prisma: tx,
                })
            })

            let payment = transaction.payment
            if (payment?.state === 'PENDING') {
                payment = await paymentOperations.initiate({
                    params: { paymentId: payment.id },
                })
            }

            return { payment }
        },
    }),
} as const

async function preValidateRegistration(
    prisma: Prisma.TransactionClient,
    eventId: number,
    isAdmin: boolean
) {
    const event = await prisma.event.findUniqueOrThrow({
        where: {
            id: eventId
        },
        include: {
            _count: {
                select: {
                    eventRegistrations: true,
                },
            },
        },
    })


    if (!event.takesRegistration) {
        throw new Smorekopp('BAD PARAMETERS', 'Cannot register for an event without registration')
    }

    if (event.registrationStart > new Date() && !isAdmin) {
        throw new Smorekopp('BAD PARAMETERS', 'Cannot register for an event before the registration period.')
    }

    if (event.registrationEnd < new Date() && !isAdmin) {
        throw new Smorekopp('BAD PARAMETERS', 'Cannot register for an event after the registration period.')
    }

    if (event.places <= event._count.eventRegistrations && !event.waitingList) {
        throw new Smorekopp('BAD PARAMETERS', 'The event is full.')
    }

    return event
}

async function postValidateRegistration(
    prisma: Prisma.TransactionClient,
    registrationId: number,
    eventId: number
) {
    const event = await prisma.event.findUniqueOrThrow({
        where: {
            id: eventId
        },
        select: {
            waitingList: true,
            places: true,
            _count: {
                select: {
                    eventRegistrations: {
                        where: {
                            id: {
                                lte: registrationId,
                            },
                        },
                    },
                },
            },
        },
    })

    if (event.places < event._count.eventRegistrations && !event.waitingList) {
        await prisma.eventRegistration.delete({
            where: {
                id: registrationId,
            },
        })

        throw new Smorekopp('BAD PARAMETERS', 'The event is full.')
    }

    return event
}

/**
 * Narrows to one segment of the registration queue of an event: the registrations that took the
 * places of the event, or the ones queueing on the waiting list past them. The first registration
 * past the places is the boundary, and since the queue is ordered by id, each segment is simply the
 * ids on one side of it.
 *
 * @returns The filter to read the segment with, or null if the segment holds no registrations.
 */
async function queueSegmentFilter(
    prisma: Prisma.TransactionClient,
    details: EventRegistrationPageDetails
): Promise<Prisma.EventRegistrationWhereInput | null> {
    const boundary = await firstOnWaitingList(prisma, details.eventId)

    if (details.type === REGISTRATION_READER_TYPE.WAITING_LIST) {
        if (!boundary) return null

        return { eventId: details.eventId, id: { gte: boundary } }
    }

    // Without anyone past the places of the event, every registration took a place.
    if (!boundary) return { eventId: details.eventId }

    return { eventId: details.eventId, id: { lt: boundary } }
}

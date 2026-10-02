import '@pn-server-only'
import { userSchemas } from './schemas'
import { userAuth } from './auth'
import {
    defaultSearchResultLimit,
    maxNumberOfGroupsInFilter,
    standardMembershipSelection,
    userFilterSelection
} from './constants'
import { userProfileImageOperations } from './profileImageCollection'
import { standardImageCollectionOperations } from '@/services/images/standard/operations'
import { expandedImageIncluder } from '@/services/images/subservice/constants'
import { notificationSubscriptionOperations } from '@/services/notifications/subscription/operations'
import { groupOperations } from '@/services/groups/operations'
import { classOperations } from '@/services/groups/classes/operations'
import { NTNUEmailDomain } from '@/services/mail/constants'
import { sendVerifyEmail } from '@/lib/email/systemMail/verifyEmail'
import { omegaMembershipGroupOperations } from '@/services/groups/omegaMembershipGroups/operations'
import { sendUserInvitationEmail } from '@/lib/email/systemMail/userInvitivation'
import { defineOperation } from '@/services/serviceOperation'
import { ServerError } from '@/services/error'
import { getMembershipFilter } from '@/auth/getMembershipFilter'
import { cursorPageingSelection } from '@/lib/paging/cursorPageingSelection'
import { hashAndEncryptPassword } from '@/auth/passwordHash'
import { omegaOrderOperations } from '@/services/omegaOrder/operations'
import { permissionOperations } from '@/services/permissions/operations'
import { ledgerAccountOperations } from '@/services/ledger/accounts/operations'
import { z } from 'zod'
import type { UserPagingReturn } from './types'

export const userOperations = {
    /**
     * This Method creates an user by invitation, and sends the invitation email.
     * WARNING: This should not be used to create users registered by Feide.
     */
    create: defineOperation({
        dataSchema: userSchemas.create,
        authorizer: () => userAuth.create.dynamicFields({}),
        operation: async ({ prisma, data }) => {
            const omegaMembership = await omegaMembershipGroupOperations.read({
                params: { omegaMembershipLevel: 'DEN_GEMENE_HOB' },
                bypassAuth: true,
            })
            const omegaOrder = await omegaOrderOperations.readCurrent({ bypassAuth: true })

            const user = await prisma.user.create({
                data: {
                    ...data,
                    memberships: {
                        create: [{
                            groupId: omegaMembership.groupId,
                            order: omegaOrder.order,
                            admin: false,
                            active: true,
                        }]
                    },
                    ledgerAccount: {
                        create: { type: 'USER' },
                    },
                },
                select: userFilterSelection
            })

            // Don't send mail during testing.
            if (process.env.NODE_ENV !== 'test') {
                setTimeout(() => sendUserInvitationEmail(user), 1000)
            }
            // The timeout is here to make sure the user is fully created before we send the email.
            // If we don't wait the validation token will be generated first, and will not be valid since
            // the user has changed after the token was generated.

            return user
        }
    }),

    read: defineOperation({
        paramsSchema: z.object({
            username: z.string().optional(),
            id: z.coerce.number().optional(),
            email: z.string().optional(),
            studentCard: z.string().optional(),
        }),
        authorizer: ({ params }) => userAuth.read.dynamicFields(params),
        operation: async ({ prisma, params }) => await prisma.user.findUniqueOrThrow({
            where: {
                id: params.id,
                ...params
            },
            select: userFilterSelection
        })
    }),

    readOrNull: defineOperation({
        paramsSchema: z.object({
            username: z.string().optional(),
            id: z.coerce.number().optional(),
            email: z.string().optional(),
            studentCard: z.string().optional(),
        }),
        authorizer: ({ params }) => userAuth.read.dynamicFields(params),
        operation: async ({ prisma, params }) => await prisma.user.findUnique({
            where: {
                id: params.id, // This is a bit wierd, but now ts is satisfied.
                ...params
            },
            select: userFilterSelection
        })
    }),

    readProfile: defineOperation({
        paramsSchema: z.object({
            username: z.string(),
        }),
        authorizer: ({ params }) => userAuth.readProfile.dynamicFields({ username: params.username }),
        operation: async ({ prisma, params }) => {
            const { id: userId } = await prisma.user.findUniqueOrThrow({
                where: { username: params.username.toLowerCase() },
                select: { id: true },
            })

            const omegaMembership = await omegaMembershipGroupOperations.readUserLevel({
                params: {
                    userId
                },
                bypassAuth: true,
            })

            const defaultProfileImage = await standardImageCollectionOperations.readStandardImage({
                params: { standardImage: 'DEFAULT_PROFILE_IMAGE' },
            })
            const user = await prisma.user.findUniqueOrThrow({
                where: { id: userId },
                select: {
                    ...userFilterSelection,
                    bio: true,
                    image: { include: expandedImageIncluder },
                    memberships: {
                        where: {
                            OR: [
                                {
                                    group: {
                                        groupType: 'COMMITTEE'
                                    }
                                },
                                {
                                    group: {
                                        groupType: 'OMEGA_MEMBERSHIP_GROUP'
                                    },
                                },
                                {
                                    group: {
                                        groupType: 'STUDY_PROGRAMME'
                                    },
                                },
                                {
                                    group: {
                                        groupType: 'INTEREST_GROUP'
                                    },
                                },
                            ]
                        },
                        include: {
                            group: {
                                include: {
                                    committee: true,
                                    interestGroup: true,
                                    omegaMembershipGroup: true,
                                    studyProgramme: true
                                }
                            }
                        }
                    }
                },
            }).then(async userData => ({
                ...userData,
                image: userData.image || defaultProfileImage,
            }))

            const memberships = await groupOperations.readMembershipsOfUser.internalCall({
                params: {
                    userId,
                }
            })
            const permissions = await permissionOperations.readPermissionsOfUser.internalCall({
                params: {
                    userId
                }
            })
            const userClass = await classOperations.readClassOfUser({
                params: {
                    userId
                },
                bypassAuth: true,
            })

            return { user, memberships, permissions, class: userClass, omegaMembership }
        }
    }),

    readPage: defineOperation({
        paramsSchema: userSchemas.readPage,
        authorizer: () => userAuth.readPage.dynamicFields({}),
        operation: async ({ prisma, params }): Promise<UserPagingReturn[]> => {
            const { page, details } = params.paging
            const words = details.partOfName.split(' ')
            const sortDirection = details.sort?.direction ?? 'asc'
            // The username is always included as the final tiebreaker so the
            // ordering stays fully deterministic for cursor-based pagination.
            const orderBy = details.sort?.field === 'username' ? [
                { username: sortDirection },
                { lastname: sortDirection },
                { firstname: sortDirection },
            ] : [
                { lastname: sortDirection },
                { firstname: sortDirection },
                { username: sortDirection },
            ]

            if (details.groups.length > maxNumberOfGroupsInFilter) {
                throw new ServerError('BAD PARAMETERS', 'Too many groups in filter')
            }
            const groupSelection = details.selectedGroup ? [
                getMembershipFilter(details.selectedGroup.groupOrder, details.selectedGroup.groupId)
            ] : []

            const groups = [...details.groups, ...(details.selectedGroup ? [details.selectedGroup] : [])]

            const users = await prisma.user.findMany({
                ...cursorPageingSelection(page),
                select: {
                    ...userFilterSelection,
                    memberships: {
                        select: {
                            admin: true,
                            title: true,
                            groupId: true,
                            group: {
                                select: {
                                    class: { select: { level: true } },
                                    studyProgramme: { select: { code: true } },
                                    omegaMembershipGroup: { select: { omegaMembershipLevel: true } }
                                }
                            }
                        },
                        where: {
                            OR: [
                                {
                                    AND: [
                                        {
                                            OR: standardMembershipSelection,
                                        },
                                        getMembershipFilter('ACTIVE')
                                    ]
                                },
                                {
                                    OR: groupSelection
                                }
                            ]

                        }
                    },
                },
                where: {
                    AND: [
                        ...words.map((word, i) => {
                            const condition = {
                                [i === words.length - 1 ? 'contains' : 'equals']: word,
                                mode: 'insensitive'
                            } as const
                            return {
                                OR: [
                                    { firstname: condition },
                                    { lastname: condition },
                                    { username: condition },
                                ],
                            }
                        }),
                        ...groups.map(group => ({
                            memberships: {
                                some: {
                                    ...getMembershipFilter(group.groupOrder, group.groupId),
                                }
                            }
                        }))
                    ],
                },
                // We have to sort with at least one unique field to have a
                // consistent order. Sorting rows by fieds that have the same
                // value is undefined behaviour in postgresql.
                orderBy
            })
            return users.map(user => {
                const clas = user.memberships.find(
                    membership => membership.group.class !== null)?.group.class?.level
                const studyProgramme = user.memberships.find(
                    membership => membership.group.studyProgramme !== null)?.group.studyProgramme?.code
                const membershipType = user.memberships.find(
                    membership =>
                        membership.group.omegaMembershipGroup !== null
                )?.group.omegaMembershipGroup?.omegaMembershipLevel
                const title = user.memberships.find(
                    membership => membership.groupId === details.selectedGroup?.groupId)?.title
                const admin = user.memberships.find(
                    membership => membership.groupId === details.selectedGroup?.groupId)?.admin
                return {
                    ...user,
                    class: clas,
                    studyProgramme,
                    membershipType,
                    selectedGroupInfo: {
                        title,
                        admin
                    }
                }
            })
        }
    }),

    /**
     * The user half of the global search: the few users best matching a free text query, for a
     * search box to show while the user types. Every word of the query must occur in some part of
     * the name of the user, so that "ola nor" finds "Ola Nordmann".
     */
    search: defineOperation({
        paramsSchema: userSchemas.search,
        authorizer: () => userAuth.search.dynamicFields({}),
        operation: async ({ prisma, params }) => {
            const words = params.query.split(/\s+/).filter(Boolean)

            const users = await prisma.user.findMany({
                take: params.limit ?? defaultSearchResultLimit,
                select: {
                    id: true,
                    username: true,
                    firstname: true,
                    lastname: true,
                    image: { include: expandedImageIncluder },
                },
                where: {
                    AND: words.map(word => ({
                        OR: [
                            { firstname: { contains: word, mode: 'insensitive' } },
                            { lastname: { contains: word, mode: 'insensitive' } },
                            { username: { contains: word, mode: 'insensitive' } },
                        ],
                    })),
                },
                orderBy: [{ lastname: 'asc' }, { firstname: 'asc' }],
            })

            const defaultProfileImage = await standardImageCollectionOperations.readStandardImage({
                params: { standardImage: 'DEFAULT_PROFILE_IMAGE' },
            })

            return users.map(user => ({ ...user, image: user.image ?? defaultProfileImage }))
        }
    }),

    connectStudentCard: defineOperation({
        authorizer: () => userAuth.connectStudentCard.dynamicFields({}),
        paramsSchema: z.object({
            studentCard: z.coerce.number().int().min(0).optional(),
        }),
        operation: async ({ prisma, params, session }) => {
            if (!session.user) {
                throw new ServerError('DISSALLOWED', 'This endpoint requires a user conencted to the session.')
            }

            await prisma.user.update({
                where: {
                    id: session.user.id
                },
                data: {
                    studentCard: params.studentCard?.toString()
                }
            })
        }
    }),

    update: defineOperation({
        paramsSchema: z.union([z.object({ id: z.number() }), z.object({ username: z.string() })]),
        dataSchema: userSchemas.update,
        authorizer: () => userAuth.update.dynamicFields({}),
        operation: ({ prisma, params, data }) => prisma.user.update({
            where: params,
            data,
        })
    }),

    updateProfile: defineOperation({
        paramsSchema: z.object({
            username: z.string()
        }),
        dataSchema: userSchemas.update,
        authorizer: ({ params }) => userAuth.updateProfile.dynamicFields({ username: params.username }),
        operation: ({ prisma, data, params }) => prisma.user.update({
            where: params,
            data,
        })
    }),

    updatePassword: defineOperation({
        paramsSchema: z.object({
            id: z.number(),
        }),
        dataSchema: userSchemas.updatePassword,
        authorizer: ({ params }) => userAuth.updatePassword.dynamicFields({ userId: params.id }),
        operation: async ({ prisma, data, params }) => {
            const passwordHash = await hashAndEncryptPassword(data.password)

            await prisma.credentials.update({
                where: {
                    userId: params.id,
                },
                data: {
                    passwordHash,
                }
            })

            return null
        }
    }),

    registerNewEmail: defineOperation({
        paramsSchema: z.object({
            id: z.number(),
        }),
        authorizer: ({ params }) => userAuth.registerNewEmail.dynamicFields({ userId: params.id }),
        dataSchema: userSchemas.registerNewEmail,
        operation: async ({ prisma, params, data }) => {
            const storedUser = await prisma.user.findUniqueOrThrow({
                where: {
                    id: params.id,
                },
                select: {
                    ...userFilterSelection,
                    feideAccount: {
                        select: {
                            email: true,
                        }
                    }
                }
            })

            // This test may not be needed if we let users change their email later. Maybe just remove this check
            if (storedUser.emailVerified) throw new ServerError('BAD PARAMETERS', 'Brukeren er allerede verifisert')

            if (data.email === storedUser.feideAccount?.email) {
                await prisma.user.update({
                    where: {
                        id: params.id,
                    },
                    data: {
                        emailVerified: (new Date()).toISOString()
                    }
                })

                return {
                    verified: true,
                    email: data.email,
                }
            }

            if (data.email.endsWith(`@${NTNUEmailDomain}`)) {
                throw new ServerError(
                    'BAD PARAMETERS',
                    `Den nye e-posten må være din ${NTNUEmailDomain}-e-post, eller en personlig e-post.`
                )
            }

            await sendVerifyEmail(storedUser, data.email)

            return {
                verified: false,
                email: data.email,
            }
        }
    }),

    /**
     * This function completes the last step of user creation: registration.
     * This can only be done once per user.
     *
     * @param id - If of user to register
     * @param rawdata - Registration data.
     * @returns null
     */
    register: defineOperation({
        paramsSchema: z.object({
            id: z.number(),
        }),
        dataSchema: userSchemas.register,
        authorizer: ({ params }) => userAuth.register.dynamicFields({ userId: params.id }),
        opensTransaction: true,
        operation: async ({ prisma, data, params }) => {
            const { sex, password, mobile, allergies, imageConsent } = data

            if (!password) throw new ServerError('BAD PARAMETERS', 'Passord er obligatorisk.')

            const storedUser = await prisma.user.findUnique({
                where: {
                    id: params.id,
                },
                select: {
                    acceptedTerms: true,
                    email: true,
                    feideAccount: {
                        select: {
                            email: true,
                        },
                    },
                    emailVerified: true,
                },
            })

            if (!storedUser) throw new ServerError('NOT FOUND', 'Could not find the user with the specified id.')

            if (storedUser.acceptedTerms) throw new ServerError('DUPLICATE', 'Brukeren er allerede registrert.')

            const passwordHash = await hashAndEncryptPassword(password)

            const results = await prisma.$transaction([
                prisma.user.update({
                    where: {
                        id: params.id,
                    },
                    data: {
                        acceptedTerms: new Date(),
                        imageConsent,
                        sex,
                        mobile,
                        allergies,
                    },
                    select: userFilterSelection
                }),
                prisma.credentials.upsert({
                    where: {
                        userId: params.id,
                    },
                    create: {
                        user: {
                            connect: {
                                id: params.id,
                            },
                        },
                        passwordHash,
                    },
                    update: {
                        passwordHash,
                    },
                })
            ])

            try {
                await notificationSubscriptionOperations.createDefault.internalCall({
                    params: {
                        userId: params.id,
                    },
                })
            } catch (error) {
                if (!(error instanceof ServerError) || error.errorCode !== 'DUPLICATE') {
                    // Duplicate subscriptions doen't do anything, and it will make development easier.
                    // In addition will this tolerate if we invalidate a users accepted terms,
                    // without deleting the user's subscriptions

                    throw error
                }
            }

            // What someone studies is what decides where they come in; anything above that is
            // earned through the admission system, so this only ever moves a user up.
            const inferredLevel = await omegaMembershipGroupOperations.inferUserLevel({
                params: {
                    userId: params.id,
                },
                bypassAuth: true,
            })

            await omegaMembershipGroupOperations.updateUserLevel({
                params: {
                    userId: params.id,
                    omegaMembershipLevel: inferredLevel,
                    onlyUpgrade: true,
                },
                bypassAuth: true,
            })

            return results[0]
        }
    }),

    readUserWithBalance: defineOperation({
        authorizer: ({ params }) => userAuth.read.dynamicFields({
            username: params.username || '',
        }),
        paramsSchema: z.object({
            username: z.string().optional(),
            id: z.number().optional(),
            email: z.string().optional(),
            studentCard: z.string().optional(),
        }),
        operation: async ({ prisma: prisma_, params }) => {
            const user = await prisma_.user.findFirstOrThrow({
                where: params,
                include: {
                    image: { include: expandedImageIncluder },
                }
            })

            if (!user.image) {
                user.image = await standardImageCollectionOperations.readStandardImage({
                    params: { standardImage: 'DEFAULT_PROFILE_IMAGE' },
                })
            }

            // bypassAuth: reading this user's own balance is already covered by userAuth.read
            // above; ledgerAccountAuth.read/calculateBalance's own ownership check would
            // otherwise reject an API-key caller (no session user) looking up someone else's
            // balance.
            const account = await ledgerAccountOperations.read({
                params: { userId: user.id },
                bypassAuth: true,
            })
            const balance = await ledgerAccountOperations.calculateBalance({
                params: { ledgerAccountId: account.id },
                bypassAuth: true,
            })

            return {
                balance: balance.amount,
                user,
            }
        }
    }),

    //TODO: Make soft delete?
    /**
     * This function deletes a user from the database.
     */
    destroy: defineOperation({
        paramsSchema: z.object({
            id: z.number(),
        }),
        authorizer: () => userAuth.destroy.dynamicFields({}),
        operation: async ({ prisma, params }) => {
            await prisma.user.delete({
                where: {
                    id: params.id,
                }
            })
        }
    }),

    updateProfileImage: defineOperation({
        authorizer: ({ params }) => userAuth.updateProfileImage.dynamicFields({ username: params.username }),
        paramsSchema: z.object({
            username: z.string(),
        }),
        dataSchema: userSchemas.updateProfileImage,
        opensTransaction: true,
        // uploadImage resizes to 3 sizes, converts to avif and writes several files to store
        // before any db write happens - comfortably slower than the default 5000ms interactive
        // transaction timeout under load, hence the raised timeout below.
        operation: async ({ prisma, params, data }) => {
            const { image: newImage, cleanup } = await prisma.$transaction(async tx => {
                const existingUser = await tx.user.findUniqueOrThrow({
                    where: { username: params.username },
                })

                const uploadedImage =
                    await userProfileImageOperations.uploadImage.internalCall({ prisma: tx, data })

                await tx.user.update({
                    where: { id: existingUser.id },
                    data: {
                        image: {
                            connect: { id: uploadedImage.id }
                        }
                    }
                })

                // A previous imageId is always an upload owned 1:1 by this user (never the shared
                // default, since that's only ever resolved at read time) - safe to destroy.
                const fileCleanup = existingUser.imageId
                    ? await userProfileImageOperations.destroyImageDbAndReturnCleanup.internalCall({
                        prisma: tx,
                        params: { imageId: existingUser.imageId }
                    })
                    : async () => {}

                return { image: uploadedImage, cleanup: fileCleanup }
            }, { timeout: 20000 })
            await cleanup()
            return newImage
        }
    }),
} as const

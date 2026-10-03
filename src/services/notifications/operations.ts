import '@pn-server-only'
import { dispatchEmailNotifications } from './email/dispatch'
import { notificationAuth } from './auth'
import { notificationSchemas } from './schemas'
import { allNotificationMethodsOn, notificationMethodsArray } from './constants'
import { availableNotificationMethodIncluder } from './channel/constants'
import { emailSchemas } from './email/schemas'
import { sendMail } from '@/lib/email/send'
import { userFilterSelection } from '@/services/users/constants'
import { defineOperation, defineSubOperation } from '@/services/serviceOperation'
import { SpecialNotificationChannel } from '@/prisma-generated-pn-types'
import { z } from 'zod'
import type { Notification } from '@/prisma-generated-pn-types'
import type { ExpandedNotificationChannel, NotificationResult } from './types'
import type { UserFiltered } from '@/services/users/types'

const dispathMethod = {
    email: dispatchEmailNotifications,
    emailWeekly: async () => { },
} satisfies Record<
    typeof notificationMethodsArray[number],
    ((channel: ExpandedNotificationChannel, notification: Notification, users: UserFiltered[]) => Promise<void>)
>

export function repalceSpecialSymbols(text: string, user: UserFiltered) {
    return text
        .replaceAll('%u', user.username)
        .replaceAll('%n', user.firstname)
        .replaceAll('%N', `${user.firstname} ${user.lastname}`)
}

export const notificationOperations = {
    /**
     * Creates a notification with the specified data.
     *
     * @param data - The detailed data for dispatching the notification.
     * @returns A promise that resolves with an object containing the dispatched notification and the number of recipients.
     */
    create: defineOperation({
        authorizer: () => notificationAuth.create,
        dataSchema: notificationSchemas.create,
        operation: async ({ prisma, data }): Promise<NotificationResult> => {
            // This prevent notifications from beeing sent during seeding
            if (process.env.IGNORE_SERVER_ONLY) {
                return {
                    notification: null,
                    recipients: 0,
                }
            }

            const notification = await prisma.notification.create({
                data: {
                    title: data.title,
                    message: data.message,
                    channel: {
                        connect: {
                            id: data.channelId,
                        },
                    },
                }
            })

            const results = await prisma.notificationChannel.findUniqueOrThrow({
                where: {
                    id: data.channelId,
                },
                include: {
                    ...availableNotificationMethodIncluder,
                    subscriptions: {
                        select: {
                            methods: {
                                select: allNotificationMethodsOn,
                            },
                            user: {
                                select: userFilterSelection,
                            },
                        },
                    },
                },
            })

            // If a userId map is sent, remove all other users.
            if (data.userIdList) {
                results.subscriptions = results.subscriptions.filter(
                    subscription => (data.userIdList && data.userIdList.includes(subscription.user.id))
                )
            }

            // TODO: Filter the users by visibility

            notificationMethodsArray.forEach(method => {
                if (!results.availableMethods[method]) {
                    return
                }

                const userFiltered = results.subscriptions
                    .filter(subscription => subscription.methods[method])
                    .map(subscription => subscription.user)

                dispathMethod[method]({
                    ...results,
                    subscriptions: undefined,
                } as ExpandedNotificationChannel, notification, userFiltered)
            })

            return {
                notification,
                recipients: results.subscriptions.length
            }
        }
    }),

    sendMail: defineOperation({
        authorizer: () => notificationAuth.sendMail,
        dataSchema: emailSchemas.sendMail,
        operation: ({ data }) => sendMail(data)
    }),

    /**
     * Createses a notification to a special notification channel.
     *
     * @param special - The special notification channel to dispatch the notification to.
     * @param title - The title of the notification.
     * @param message - The message content of the notification.
     * @returns A promise that resolves with an object containing the dispatched notification and the number of recipients.
     */
    createSpecial: defineSubOperation({
        paramsSchema: () => z.object({
            special: z.nativeEnum(SpecialNotificationChannel),
        }),
        dataSchema: () => notificationSchemas.createSpecial,
        operation: () => async ({ prisma, params, data, session }): Promise<NotificationResult> => {
            const channel = await prisma.notificationChannel.findUniqueOrThrow({
                where: {
                    special: params.special,
                }
            })

            return await notificationOperations.create({
                session,
                bypassAuth: true,
                data: {
                    channelId: channel.id,
                    title: data.title,
                    message: data.message,
                    userIdList: data.userIdList,
                }
            })
        }
    }),
}

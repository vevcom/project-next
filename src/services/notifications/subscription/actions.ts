'use server'
import { makeAction } from '@/services/serverAction'
import { notificationSubscriptionOperations } from '@/services/notifications/subscription/operations'

export const readNotificationSubscriptionsAction = makeAction(notificationSubscriptionOperations.read)
export const updateNotificationSubscriptionsAction = makeAction(notificationSubscriptionOperations.update)

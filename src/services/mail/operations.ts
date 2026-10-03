import '@pn-server-only'
import { mailAuth } from './auth'
import { mailSchemas } from './schemas'
import { aliasOperations } from './alias/operations'
import { mailingListOperations } from './list/operations'
import { mailAddressExternalOperations } from './mailAddressExternal/operations'
import { userFilterSelection } from '@/services/users/constants'
import { defineOperation } from '@/services/serviceOperation'
import { ServerError } from '@/services/error'
import type { Prisma } from '@/prisma-generated-pn-client'
import type { MailFlowObject, ViaArrayType, ViaType } from './types'
import type { UserFiltered } from '@/services/users/types'
import type {
    MailAlias,
    MailAliasMailingList,
    MailAddressExternal,
    MailingList,
    MailingListGroup,
    MailingListMailAddressExternal,
    MailingListUser,
} from '@/prisma-generated-pn-types'


/**
 * This file reads how incomming mail is routed.
 * Mail flows in one direction
 * Mailalis -> Mailinglist  -> User
 *                          -> Group -> User
 *                          -> External address
 *
 * To show how the mail traverses, each node in the network above can be used
 * as a source to read the traversal in both directions.
 * Each of the traversal functions is divieded in four parts
 *  1. Fetch the data from the database
 *  2. Parse the data into arrays with only one type of object
 *       This step also adds a via object (next paragraph) if it is nessasary
 *  3. Delete unnessesary fields
 *  4. Combine duplicate nodes
 *
 *
 * Since some nodes may have different paths to itself, a via property is used.
 * For example a user can be directly connected to a mailinglist or via a group.
 * We only want the user to appear once, but we want to return
 * all the paths to the users (both via the group and direct).
 *
 *
 * The end results should be an object that can be displayed to the user to show
 * how mail is routed though a arbirtrary node in the network.
*/

/**
 * Removes duplicates from an array of objects based on their `id` property.
 * If multiple objects have the same `id`, the first object encountered is kept,
 * and the `via` property of subsequent objects with the same `id` is merged into the first object's `via` array.
 * @param objects An array of objects to remove duplicates from.
 * @returns An array of objects with duplicates removed.
 */
function removeDuplicates<T extends {
    id: number,
} & ViaArrayType>(objects: T[]): T[] {
    const encounteredIds = new Set()
    const ret: T[] = []

    for (const obj of objects) {
        if (encounteredIds.has(obj.id)) {
            const exisingObj = ret.find(item => item.id === obj.id)
            if (exisingObj && exisingObj.via && obj.via && obj.via instanceof Array) {
                const via = obj.via[0]

                const alredyAdded = exisingObj.via.find(item => (item.type === via.type && item.id === via.id))
                if (!alredyAdded) {
                    exisingObj.via.push(via)
                }
            }
        } else {
            encounteredIds.add(obj.id)
            ret.push(obj)
        }
    }

    return ret
}

async function readAliasTraversal(prisma: Prisma.TransactionClient, id: number): Promise<MailFlowObject> {
    const results = await prisma.mailAlias.findUniqueOrThrow({
        where: {
            id,
        },
        include: {
            mailingLists: {
                include: {
                    mailingList: {
                        include: {
                            groups: {
                                include: {
                                    group: {
                                        include: {
                                            memberships: {
                                                // TODO: only find valid memberships
                                                include: {
                                                    user: {
                                                        select: userFilterSelection,
                                                    }
                                                }
                                            }
                                        }
                                    }
                                },
                            },
                            users: {
                                include: {
                                    user: {
                                        select: userFilterSelection,
                                    },
                                },
                            },
                            mailAddressExternal: {
                                include: {
                                    mailAddressExternal: true,
                                }
                            }
                        }
                    }
                }
            }
        }
    })

    const mailAlias = results

    const mailingList = results.mailingLists.map(list => list.mailingList)

    const group = results.mailingLists.map(list => list.mailingList.groups.map(groupItem => {
        const via: ViaType = {
            type: 'mailingList',
            id: list.mailingListId,
            label: list.mailingList.name
        }

        return {
            ...groupItem.group,
            via: [via]
        }
    })).flat()

    const user = results.mailingLists.map(list => list.mailingList.users.map(userItem => {
        const via: ViaType = {
            type: 'mailingList',
            id: list.mailingListId,
            label: list.mailingList.name
        }

        return {
            ...userItem.user,
            via: [via],
        }
    }))
        .concat(results.mailingLists.map(list =>
            list.mailingList.groups.map(groupItem => groupItem.group.memberships.map(membership => {
                const via: ViaType = {
                    type: 'group',
                    id: groupItem.groupId,
                    label: String(groupItem.groupId)
                }

                return {
                    ...membership.user,
                    via: [via]
                }
            })).flat()
        )).flat()

    const mailaddressExternal = results.mailingLists
        .map(list => list.mailingList.mailAddressExternal.map(address => {
            const via: ViaType = {
                type: 'mailingList',
                id: list.mailingListId,
                label: list.mailingList.name
            }

            return {
                ...address.mailAddressExternal,
                via: [via]
            }
        })).flat()


    Reflect.deleteProperty(mailAlias, 'mailingLists')

    return {
        alias: [mailAlias],
        mailingList: mailingList.map(list => {
            Reflect.deleteProperty(list, 'users')
            Reflect.deleteProperty(list, 'groups')
            Reflect.deleteProperty(list, 'mailAddressExternal')
            return list
        }),
        group: removeDuplicates(group.map(groupItem => {
            Reflect.deleteProperty(groupItem, 'memberships')
            return groupItem
        })),
        user: removeDuplicates(user),
        mailaddressExternal: removeDuplicates(mailaddressExternal),
    }
}

async function readMailingListTraversal(prisma: Prisma.TransactionClient, id: number): Promise<MailFlowObject> {
    const results = await prisma.mailingList.findUniqueOrThrow({
        where: {
            id,
        },
        include: {
            mailAliases: {
                include: {
                    mailAlias: true,
                },
            },
            groups: {
                include: {
                    group: {
                        include: {
                            memberships: {
                                /*where: {
                                    active: true,
                                },*/
                                include: {
                                    user: {
                                        select: userFilterSelection,
                                    }
                                }
                            }
                        }
                    }, // TODO: Add users in group
                },
            },
            users: {
                include: {
                    user: {
                        select: userFilterSelection,
                    },
                },
            },
            mailAddressExternal: {
                include: {
                    mailAddressExternal: true,
                },
            },
        }
    })

    const mailingList = results
    const alias = mailingList.mailAliases.map(aliasItem => aliasItem.mailAlias)
    const group = mailingList.groups.map(groupItem => groupItem.group)
    const user = mailingList.users
        .map(userItem => userItem.user)
        .concat(
            mailingList.groups
                .map(groupItem => groupItem.group.memberships.map(membership => {
                    const via: ViaType = {
                        type: 'group',
                        id: groupItem.groupId,
                        label: String(groupItem.groupId)
                    }

                    return {
                        ...membership.user,
                        via: [via],
                    }
                }))
                .flat()
        )
    const mailaddressExternal = mailingList.mailAddressExternal.map(address => address.mailAddressExternal)

    Reflect.deleteProperty(mailingList, 'mailAliases')
    Reflect.deleteProperty(mailingList, 'groups')
    Reflect.deleteProperty(mailingList, 'users')
    Reflect.deleteProperty(mailingList, 'mailAddressExternal')

    return {
        mailingList: [mailingList],
        alias,
        group: group.map(groupItem => {
            Reflect.deleteProperty(groupItem, 'memberships')
            return groupItem
        }),
        user: removeDuplicates(user),
        mailaddressExternal,
    }
}

async function readMailaddressExternalTraversal(prisma: Prisma.TransactionClient, id: number): Promise<MailFlowObject> {
    const results = await prisma.mailAddressExternal.findUniqueOrThrow({
        where: {
            id,
        },
        include: {
            mailingLists: {
                include: {
                    mailingList: {
                        include: {
                            mailAliases: {
                                include: {
                                    mailAlias: true,
                                }
                            }
                        }
                    }
                }
            }
        }
    })

    const mailAddressExternal = results
    const mailingList = results.mailingLists.map(list => list.mailingList)
    const aliases = results.mailingLists.map(
        list => list.mailingList.mailAliases.map(aliasItem => {
            const via: ViaType = {
                type: 'mailingList',
                id: list.mailingListId,
                label: list.mailingList.name
            }

            return {
                ...aliasItem.mailAlias,
                via: [via],
            }
        }),
    ).flat()

    Reflect.deleteProperty(mailAddressExternal, 'mailingLists')

    return {
        mailaddressExternal: [mailAddressExternal],
        mailingList: mailingList.map(list => {
            Reflect.deleteProperty(list, 'mailAliases')
            return list
        }),
        alias: removeDuplicates(aliases),
        user: [],
        group: [],
    }
}

async function readGroupTraversal(prisma: Prisma.TransactionClient, id: number): Promise<MailFlowObject> {
    const results = await prisma.group.findUniqueOrThrow({
        where: {
            id,
        },
        include: {
            memberships: {
                include: {
                    user: {
                        select: userFilterSelection,
                    }
                }
            },
            mailingLists: {
                include: {
                    mailingList: {
                        include: {
                            mailAliases: {
                                include: {
                                    mailAlias: true,
                                },
                            }
                        },
                    },
                },
            },
        }
    })

    const group = results
    const mailingList = results.mailingLists.map(list => list.mailingList)
    const alias = mailingList
        .map(mlist => mlist.mailAliases.map(aliasItem => {
            const via: ViaType = {
                type: 'mailingList',
                id: mlist.id,
                label: mlist.name
            }

            return {
                ...aliasItem.mailAlias,
                via: [via]
            }
        }))
        .flat()

    const user = results.memberships.map(membership => membership.user)

    Reflect.deleteProperty(group, 'memberships')
    Reflect.deleteProperty(group, 'mailingLists')

    return {
        mailaddressExternal: [],
        mailingList: mailingList.map(mlist => {
            Reflect.deleteProperty(mlist, 'mailAliases')
            return mlist
        }),
        alias: removeDuplicates(alias),
        user,
        group: [group],
    }
}

async function readUserTraversal(prisma: Prisma.TransactionClient, id: number): Promise<MailFlowObject> {
    const results = await prisma.user.findUniqueOrThrow({
        where: {
            id,
        },
        select: {
            ...userFilterSelection,
            mailingLists: {
                include: {
                    mailingList: {
                        include: {
                            mailAliases: {
                                include: {
                                    mailAlias: true,
                                }
                            }
                        }
                    }
                }
            },
            memberships: {
                include: {
                    group: {
                        include: {
                            mailingLists: {
                                include: {
                                    mailingList: {
                                        include: {
                                            mailAliases: {
                                                include: {
                                                    mailAlias: true,
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    })

    const user = results
    const mailingList = results.mailingLists
        .map(mlist => mlist.mailingList)
        .concat(
            results.memberships.map(membership => membership.group.mailingLists.map(mlist => {
                const via: ViaType = {
                    type: 'group',
                    id: membership.groupId,
                    label: String(membership.groupId)
                }

                return {
                    ...mlist.mailingList,
                    via: [via]
                }
            })).flat()
        )

    const alias = results.mailingLists
        .map(list => list.mailingList.mailAliases.map(aliasItem => {
            const via: ViaType = {
                type: 'mailingList',
                id: list.mailingListId,
                label: list.mailingList.name
            }

            return {
                ...aliasItem.mailAlias,
                via: [via]
            }
        }))
        .concat(
            results.memberships
                .map(membership => membership.group.mailingLists
                    .map(listItem => listItem.mailingList.mailAliases.map(aliasItem => {
                        const via: ViaType = {
                            type: 'mailingList',
                            id: listItem.mailingListId,
                            label: listItem.mailingList.name
                        }

                        return {
                            ...aliasItem.mailAlias,
                            via: [via]
                        }
                    })).flat()
                )
        ).flat()

    const group = results.memberships.map(membership => membership.group)

    Reflect.deleteProperty(user, 'mailingLists')
    Reflect.deleteProperty(user, 'memberships')

    return {
        mailaddressExternal: [],
        mailingList: removeDuplicates(mailingList.map(mlist => {
            Reflect.deleteProperty(mlist, 'mailAliases')
            return mlist
        })),
        alias: removeDuplicates(alias),
        user: [user],
        group: group.map(groupItem => {
            Reflect.deleteProperty(groupItem, 'mailingLists')
            return groupItem
        }),
    }
}


export const mailOperations = {
    createAliasMailingListRelation: defineOperation({
        dataSchema: mailSchemas.createAliasMailingListRelation,
        authorizer: () => mailAuth.createAliasMailingListRelation,
        operation: async ({ prisma, data }): Promise<MailAliasMailingList> =>
            prisma.mailAliasMailingList.create({
                data: {
                    mailAlias: { connect: { id: data.mailAliasId } },
                    mailingList: { connect: { id: data.mailingListId } },
                },
            }),
    }),

    createMailingListExternalRelation: defineOperation({
        dataSchema: mailSchemas.createMailingListExternalRelation,
        authorizer: () => mailAuth.createMailingListExternalRelation,
        operation: async ({ prisma, data }): Promise<MailingListMailAddressExternal> =>
            prisma.mailingListMailAddressExternal.create({
                data: {
                    mailingList: { connect: { id: data.mailingListId } },
                    mailAddressExternal: { connect: { id: data.mailAddressExternalId } },
                },
            }),
    }),

    createMailingListUserRelation: defineOperation({
        dataSchema: mailSchemas.createMailingListUserRelation,
        authorizer: () => mailAuth.createMailingListUserRelation,
        operation: async ({ prisma, data }): Promise<MailingListUser> =>
            prisma.mailingListUser.create({
                data: {
                    mailingList: { connect: { id: data.mailingListId } },
                    user: { connect: { id: data.userId } },
                },
            }),
    }),

    createMailingListGroupRelation: defineOperation({
        dataSchema: mailSchemas.createMailingListGroupRelation,
        authorizer: () => mailAuth.createMailingListGroupRelation,
        operation: async ({ prisma, data }): Promise<MailingListGroup> =>
            prisma.mailingListGroup.create({
                data: {
                    mailingList: { connect: { id: data.mailingListId } },
                    group: { connect: { id: data.groupId } },
                },
            }),
    }),

    destroyAliasMailingListRelation: defineOperation({
        dataSchema: mailSchemas.destroyAliasMailingListRelation,
        authorizer: () => mailAuth.destroyAliasMailingListRelation,
        operation: async ({ prisma, data }): Promise<MailAliasMailingList> =>
            prisma.mailAliasMailingList.delete({
                where: {
                    mailAliasId_mailingListId: data,
                },
            }),
    }),

    destroyMailingListExternalRelation: defineOperation({
        dataSchema: mailSchemas.destroyMailingListExternalRelation,
        authorizer: () => mailAuth.destroyMailingListExternalRelation,
        operation: async ({ prisma, data }): Promise<MailingListMailAddressExternal> =>
            prisma.mailingListMailAddressExternal.delete({
                where: {
                    mailingListId_mailAddressExternalId: data,
                },
            }),
    }),

    destroyMailingListUserRelation: defineOperation({
        dataSchema: mailSchemas.destroyMailingListUserRelation,
        authorizer: () => mailAuth.destroyMailingListUserRelation,
        operation: async ({ prisma, data }): Promise<MailingListUser> =>
            prisma.mailingListUser.delete({
                where: {
                    mailingListId_userId: data,
                },
            }),
    }),

    destroyMailingListGroupRelation: defineOperation({
        dataSchema: mailSchemas.destroyMailingListGroupRelation,
        authorizer: () => mailAuth.destroyMailingListGroupRelation,
        operation: async ({ prisma, data }): Promise<MailingListGroup> =>
            prisma.mailingListGroup.delete({
                where: {
                    mailingListId_groupId: data,
                },
            }),
    }),

    readMailTraversal: defineOperation({
        paramsSchema: mailSchemas.readMailFlow,
        authorizer: () => mailAuth.readMailFlow,
        operation: async ({ prisma, params }): Promise<MailFlowObject> => {
            if (params.filter === 'alias') return readAliasTraversal(prisma, params.id)
            if (params.filter === 'mailingList') return readMailingListTraversal(prisma, params.id)
            if (params.filter === 'mailaddressExternal') return readMailaddressExternalTraversal(prisma, params.id)
            if (params.filter === 'group') return readGroupTraversal(prisma, params.id)
            if (params.filter === 'user') return readUserTraversal(prisma, params.id)
            throw new ServerError('BAD PARAMETERS', `The filter ${params.filter} is not a valid MailListTypes`)
        },
    }),

    readMailOptions: defineOperation({
        authorizer: () => mailAuth.readMailOptions,
        operation: async (): Promise<{
            alias: MailAlias[],
            mailingList: MailingList[],
            mailaddressExternal: MailAddressExternal[],
            users: UserFiltered[],
        }> => {
            const results = await Promise.all([
                aliasOperations.readMany({ bypassAuth: true }),
                mailingListOperations.readMany({ bypassAuth: true }),
                mailAddressExternalOperations.readMany({ bypassAuth: true }),
            ])

            return {
                alias: results[0],
                mailingList: results[1],
                mailaddressExternal: results[2],
                users: [],
            }
        },
    }),
} as const

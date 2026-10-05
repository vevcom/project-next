import { Session } from '@/auth/session/Session'
import { Smorekopp } from '@/services/error'
import { prisma } from '@/prisma-pn-client-instance'
import { manualGroupOperations } from '@/services/groups/manualGroups/operations'
import { apiKeyOperations } from '@/services/apiKeys/operations'
import { permissionOperations } from '@/services/permissions/operations'
import { cabinSettingsOperations } from '@/services/cabin/settings/operations'
import { userFilterSelection } from '@/services/users/constants'
import { describe, expect, test } from '@jest/globals'
import type { Permission } from '@/prisma-generated-pn-types'

let counter = 0

async function createUser() {
    const username = `gi-tillatelser-${++counter}`
    return prisma.user.create({
        data: { username, email: `${username}@example.com`, bioParagraph: { create: {} } },
        select: userFilterSelection,
    })
}

function sessionWith(permissions: Permission[], user: Awaited<ReturnType<typeof createUser>> | null = null) {
    return Session.fromJsObject({ memberships: [], permissions, user })
}

async function createGroupWith(permissions: Permission[]) {
    const manualGroup = await manualGroupOperations.create({
        data: { name: `Gruppe med tillatelser ${++counter}`, shortName: `tillatelser-${counter}` },
        session: sessionWith(['MANUAL_GROUP_ADMIN']),
    })
    await prisma.groupPermission.createMany({
        data: permissions.map(permission => ({ groupId: manualGroup.groupId, permission })),
    })
    return manualGroup.groupId
}

describe('handing on group memberships', () => {
    const addSelf = async (permissions: Permission[]) => {
        const groupId = await createGroupWith(['USERS_ADMIN'])
        const user = await createUser()
        return manualGroupOperations.addMembers({
            params: { groupId },
            data: { users: [{ userId: user.id, admin: false }] },
            session: sessionWith(permissions, user),
        })
    }

    test('the group type admin cannot add members to a group with permissions they lack', async () => {
        await expect(addSelf(['MANUAL_GROUP_ADMIN'])).rejects.toThrow(new Smorekopp('UNAUTHORIZED'))
    })

    test('the group type admin can when they hold the permissions already', async () => {
        await expect(addSelf(['MANUAL_GROUP_ADMIN', 'USERS_ADMIN'])).resolves.not.toThrow()
    })

    test('PERMISSION_ADMIN may grant any group', async () => {
        await expect(addSelf(['MANUAL_GROUP_ADMIN', 'PERMISSION_ADMIN'])).resolves.not.toThrow()
    })

    test('the group admin may add members and make admins', async () => {
        const groupId = await createGroupWith(['USERS_ADMIN'])
        const [groupAdmin, newMember] = await Promise.all([createUser(), createUser()])
        await prisma.membership.create({ data: {
            groupId,
            userId: groupAdmin.id,
            admin: true,
            active: true,
            order: (await prisma.group.findUniqueOrThrow({ where: { id: groupId } })).order,
        } })
        const session = Session.fromJsObject({
            memberships: await prisma.membership.findMany({ where: { userId: groupAdmin.id } }),
            // What a real session of the group admin holds: the permissions of the group.
            permissions: ['USERS_ADMIN'],
            user: groupAdmin,
        })

        await manualGroupOperations.addMembers({
            params: { groupId },
            data: { users: [{ userId: newMember.id, admin: false }] },
            session,
        })
        await manualGroupOperations.setMemberAdmin({
            params: { groupId },
            data: { userId: newMember.id, admin: true },
            session,
        })
    })
})

describe('reading the permissions of a group', () => {
    test('is open to the admins of its group type, not to anyone else', async () => {
        const groupId = await createGroupWith(['USERS_ADMIN'])
        const user = await createUser()
        const read = (permissions: Permission[]) => permissionOperations.readPermissionsOfGroup({
            params: { groupId },
            session: sessionWith(permissions, user),
        })

        expect(await read(['MANUAL_GROUP_ADMIN'])).toEqual(['USERS_ADMIN'])
        await expect(read(['COMMITTEE_ADMIN'])).rejects.toThrow(new Smorekopp('UNAUTHORIZED'))
    })
})

describe('api key permissions', () => {
    test('an APIKEY_ADMIN can only give a key permissions they hold', async () => {
        const session = sessionWith(['APIKEY_ADMIN'], await createUser())
        const apiKey = await apiKeyOperations.create({ data: { name: 'Nøkkel med tillatelser' }, session })

        await expect(apiKeyOperations.update({
            params: apiKey,
            data: { permissions: ['USERS_ADMIN'] },
            session,
        })).rejects.toThrow(new Smorekopp('UNAUTHORIZED'))

        await prisma.apiKey.update({ where: { id: apiKey.id }, data: { permissions: ['USERS_ADMIN'] } })
        await apiKeyOperations.update({
            params: apiKey,
            data: { name: 'Nytt navn på nøkkelen', permissions: ['USERS_ADMIN', 'APIKEY_ADMIN'] },
            session,
        })
    })
})

describe('cabin revenue account', () => {
    test('takes LEDGER_ADMIN and a group account', async () => {
        const user = await createUser()
        const userAccount = await prisma.ledgerAccount.create({ data: { type: 'USER' } })

        await expect(cabinSettingsOperations.update({
            data: { ledgerAccountId: userAccount.id },
            session: sessionWith(['CABIN_ADMIN'], user),
        })).rejects.toThrow(new Smorekopp('UNAUTHORIZED'))

        await expect(cabinSettingsOperations.update({
            data: { ledgerAccountId: userAccount.id },
            session: sessionWith(['CABIN_ADMIN', 'LEDGER_ADMIN'], user),
        })).rejects.toThrow(new Smorekopp('BAD PARAMETERS'))
    })
})

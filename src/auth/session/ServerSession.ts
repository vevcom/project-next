import { Session, type UserGuaranteeOption } from './Session'
import { authOptions } from '@/auth/nextAuth/authOptions'
import { apiKeyOperations } from '@/services/apiKeys/operations'
import { apiKeyDecryptAndCompare } from '@/services/apiKeys/hashEncryptKey'
import { decodeApiKey } from '@/services/apiKeys/apiKeyEncoder'
import { ServerError } from '@/services/error'
import { permissionOperations } from '@/services/permissions/operations'
import { getServerSession as getSessionNextAuth } from 'next-auth'

export class ServerSession<UserGuarantee extends UserGuaranteeOption> extends Session<UserGuarantee> {
    public static async fromNextAuth(): Promise<Session<'NO_USER'> | Session<'HAS_USER'>> {
        const session = await getSessionNextAuth(authOptions)

        if (!session) {
            const defaultPermissions = await permissionOperations.readDefaultPermissions({ bypassAuth: true })
            return ServerSession.fromDefaultPermissions(defaultPermissions)
        }

        return Session.fromJsObject({
            user: session.user,
            permissions: session.permissions,
            memberships: session.memberships,
        })
    }

    /**
     * This function generates a Session from an api-key. If the key is bad
     * an error will be thrown.
     * @param key - The key provided by client in the `id=keyId&key=key` format
     * If the key is null, the session will be cratedwith only default permissios
     */
    public static async fromApiKey(keyAndIdEncoded: string | null): Promise<Session<'NO_USER'>> {
        const defaultPermissions = await permissionOperations.readDefaultPermissions({
            bypassAuth: true,
        })
        if (!keyAndIdEncoded) return new Session<'NO_USER'>({ user: null, permissions: defaultPermissions, memberships: [] })
        const { id, key } = decodeApiKey(keyAndIdEncoded)

        const INVALID_API_KEY_MESSAGE = 'Api nøkkelen er ikke valid'

        let apiKeyFetch

        try {
            apiKeyFetch = await apiKeyOperations.readWithHash({
                bypassAuth: true,
                params: { id }
            })
        } catch (e) {
            if (e instanceof ServerError && e.errorCode === 'NOT FOUND') {
                throw new ServerError('INVALID API KEY', INVALID_API_KEY_MESSAGE)
            }
            throw e
        }

        const { keyHashEncrypted, active, permissions } = apiKeyFetch

        if (!active) throw new ServerError('INVALID API KEY', 'Api nøkkelen har utløpt')

        const success = await apiKeyDecryptAndCompare(key, keyHashEncrypted)
        if (!success) throw new ServerError('INVALID API KEY', INVALID_API_KEY_MESSAGE)

        return new Session<'NO_USER'>({
            user: null,
            permissions: [...defaultPermissions, ...permissions].filter(
                (permission, i, ps) => ps.indexOf(permission) === i
            ),
            memberships: [],
            apiKeyId: id,
        })
    }
}

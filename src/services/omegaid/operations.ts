import '@pn-server-only'
import { omegaIdAuth } from './auth'
import { omegaIdSchemas } from './schemas'
import { OmegaIdExpiryTime } from './constants'
import { defineOperation } from '@/services/serviceOperation'
import { generateJWT } from '@/jwt/jwt'
import { readPemEnvBase64 } from '@/jwt/readPemEnvBase64'
import { ServerError } from '@/services/error'

export const omegaIdOperations = {
    generate: defineOperation({
        authorizer: ({ params }) => omegaIdAuth.generate.data({ userId: params.userId }),
        paramsSchema: omegaIdSchemas.generate,
        operation: ({ params }) =>
            generateJWT('omegaid', { sub: params.userId }, OmegaIdExpiryTime, true),
    }),
    readPublicKey: defineOperation({
        authorizer: () => omegaIdAuth.readPublicKey,
        operation: () => {
            const key = process.env.JWT_PUBLIC_KEY
            if (!key) {
                throw new ServerError('INVALID CONFIGURATION', 'The JWT_PUBLIC_KEY must be set')
            }
            return readPemEnvBase64(key)
        },
    }),
} as const

import '@pn-server-only'
import VevenAdapter from './VevenAdapter'
import { compressJwt, decompressJwt } from './jwtCompression'
import { decryptAndComparePassword } from '@/auth/passwordHash'
import FeideProvider from '@/lib/feide/FeideProvider'
import {
    inferClassFromStudyProgrammes,
    inferOmegaMembershipFromStudyProgrammes,
    updateUserStudyProgrammes,
} from '@/lib/feide/userRoutines'
import { prisma } from '@/prisma-pn-client-instance'
import { groupOperations } from '@/services/groups/operations'
import { updateEmailForFeideAccount } from '@/services/auth/feideAccounts/update'
import { userOperations } from '@/services/users/operations'
import { permissionOperations } from '@/services/permissions/operations'
import logger from '@/lib/logger'
import CredentialsProvider from 'next-auth/providers/credentials'
import { encode, decode } from 'next-auth/jwt'
import type { AuthOptions } from 'next-auth'

export const authOptions: AuthOptions = {
    providers: [
        CredentialsProvider({
            name: 'Credentials',
            credentials: {
                username: { label: 'Username', type: 'text' },
                password: { label: 'Password', type: 'password' },
            },
            authorize: async (credentials) => {
                if (!credentials?.username || !credentials.password) return null

                // Sign in with email insted of username

                // This should be an action
                const userCredentials = await prisma.credentials.findUnique({
                    where: {
                        username: credentials.username.toLowerCase(),
                    },
                    select: {
                        userId: true,
                        passwordHash: true,
                    },
                })

                if (!userCredentials) return null

                const passwordMatch = await decryptAndComparePassword(credentials.password, userCredentials.passwordHash)

                if (!passwordMatch) return null

                return { id: String(userCredentials.userId) }
            }
        }),
        FeideProvider({
            clientId: process.env.FEIDE_CLIENT_ID ?? 'no_id',
            clientSecret: process.env.FEIDE_CLIENT_SECRET ?? 'no_secret',
        })
    ],
    session: {
        strategy: 'jwt'
    },
    jwt: {
        async encode(params) {
            params.token = await compressJwt(params.token)
            return encode(params)
        },

        async decode(params) {
            const decodedToken = await decode(params)

            if (!decodedToken) return null

            const token = await decompressJwt(decodedToken)

            // iat = issued at (timestamp given in seconds since epoch)
            if (!token || !token.iat) return null

            switch (token.provider) {
                case 'credentials': {
                    const credentials = await prisma.credentials.findUnique({
                        where: {
                            userId: token.user.id
                        },
                        select: {
                            credentialsUpdatedAt: true
                        }
                    })

                    // Check if the users credentials were updated after the token was
                    // created. I.e. if the user updates their password you don't want
                    // their old token to be valid. 'iat' is given in seconds so we
                    // have to convert it to milliseconds.
                    // Add 10 seconds to get time to login after a credentials update
                    if (!credentials || token.iat * 1000 < credentials.credentialsUpdatedAt.getTime() - 10000) return null

                    break
                }
                case 'feide': {
                    const hasFeide = await prisma.feideAccount.count({
                        where: {
                            userId: token.user.id
                        },
                    })

                    if (!hasFeide) return null

                    break
                }
                default: {
                    return null
                }
            }

            return token
        },
    },
    callbacks: {
        async session({ session, token }) {
            session.user = token.user
            session.permissions = token.permissions
            session.memberships = token.memberships
            return session
        },
        async jwt({ account, profile, token, trigger, user }) {
            switch (trigger) {
                case 'signUp':
                case 'signIn': {
                    if (account?.provider === 'feide') {
                        if (!account.access_token) {
                            // Should never happen.
                            throw new Error('Account has no access token!')
                        }

                        if (profile?.email) await updateEmailForFeideAccount(account.providerAccountId, profile.email)

                        const userId = user ? Number(user.id) : token.user.id

                        const studyProgrammes = await updateUserStudyProgrammes(userId, account.access_token)
                        await inferClassFromStudyProgrammes(userId, studyProgrammes)
                        await inferOmegaMembershipFromStudyProgrammes(userId)
                    }
                    logger.info('Log in', { userName: user.username, userId: user.id })
                    break
                }
                // Trigger is undefined for subsequent calls
                case undefined: {
                    const dbUser = await userOperations.read({
                        params: { id: token.user.id },
                        bypassAuth: true,
                    })

                    // Check if the user data that is on the jwt was changed
                    // after the token was created. If so get new data from db.
                    // 'iat' is given in seconds so we have to convert it to
                    // milliseconds.
                    if (token.iat && token.iat * 1000 > dbUser?.updatedAt.getTime()) {
                        return token
                    }

                    break
                }
                // There exists a third trigger 'update' which we don't support.
                default: {
                    throw new Error(`Got unsupported trigger in jwt callback. Trigger: ${trigger}`)
                }
            }

            // The 'user' object will only be set when the trigger is 'signIn'.
            // We also have to type convert 'user.id' because the default next
            // auth type for it is different from our model.
            const userId = user ? Number(user.id) : token?.user.id

            // The account object will only be available during sign in/up.
            // For other cases we will already have a provider stored in the token
            // which we can reuse.
            const provider = account?.provider ?? token.provider

            if (provider !== 'credentials' && provider !== 'feide') {
                throw new Error(`Got unsupported provider. Provider: ${provider}`)
            }

            return {
                provider,
                user: await userOperations.read({
                    params: { id: userId },
                    bypassAuth: true,
                }),
                permissions: await permissionOperations.readPermissionsOfUser({
                    params: {
                        userId,
                    },
                    bypassAuth: true,
                }),
                memberships: await groupOperations.readMembershipsOfUser.internalCall({
                    params: {
                        userId,
                    }
                }),
            }
        }
    },
    pages: {
        signIn: '/login',
        signOut: '/logout',
        newUser: '/register',
    },
    adapter: VevenAdapter(prisma),
    logger: {
        error(code, metadata) {
            // When in development mode JWT are invalidated at each restart,
            // thus producing a lot of noise in both the logs and in the browser.
            // Therefore, we log these as warnings instead of errors.
            if (code === 'JWT_SESSION_ERROR') {
                logger.warn(`NextAuth error: ${code}`, { code, metadata })
            } else {
                logger.error(`NextAuth error: ${code}`, { code, metadata })
            }
        },
        warn(code) {
            logger.warn(`NextAuth warning: ${code}`, { code })
        },
    }
}

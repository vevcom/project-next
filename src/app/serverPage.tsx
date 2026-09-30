import '@pn-server-only'
import ServiceErrorView from '@/components/ServiceErrorView/ServiceErrorView'
import PageTitleSetter from '@/contexts/PageTitleSetter'
import { Smorekopp } from '@/services/error'
import { withServiceContext } from '@/services/serviceOperation'
import { ServerSession } from '@/auth/session/ServerSession'
import { CURRENT_PATH_HEADER } from '@/proxy'
import { notFound, redirect, unstable_rethrow as unstableRethrow } from 'next/navigation'
import { headers } from 'next/headers'
import { cache } from 'react'
import type { ErrorCode } from '@/services/error'
import type { AuthStatus } from '@/auth/authorizer/AuthResult'
import type { AuthorizerDynamicFieldsBound, UserRequieredOutOpt } from '@/auth/authorizer/Authorizer'
import type { Session } from '@/auth/session/Session'
import type { Metadata } from 'next'
import type { ReactNode } from 'react'

export type SearchParams = { [key: string]: string | string[] | undefined }

export type ServerPageSession = Session<'HAS_USER'> | Session<'NO_USER'>

/**
 * The arguments a serverPage operation receives. Pages with route params annotate their
 * operation callback with this to declare the params' shape:
 * `operation: async ({ params }: PageOperationArgs<{ id: string }>) => ...`
 */
export type PageOperationArgs<Params extends object = object> = {
    params: Params,
    searchParams: SearchParams,
    session: ServerPageSession,
}

type PageProps<Params extends object> = {
    params: Promise<Params>,
    searchParams: Promise<SearchParams>,
}

type AuthCheckerBound = AuthorizerDynamicFieldsBound<UserRequieredOutOpt, object | undefined>

/**
 * The results of running the declared auth checkers - same keys as the authCheckers object
 * (all of the form `can[Something]`), but each value is the AuthResult of running that
 * authorizer against the session of the current request.
 */
export type AuthChecks<CheckerKeys extends `can${string}`> = Record<
    CheckerKeys, ReturnType<AuthCheckerBound['auth']>
>

/**
 * Rethrows everything that should not be handled by rendering an error view:
 * Next.js control-flow errors (redirect/notFound) and non-service errors (which belong
 * in the error boundary - they are bugs, not expected failures). Service errors get their
 * conventional treatment: NOT FOUND renders the not-found page and UNAUTHENTICATED sends
 * the user to login. Every other service error is returned for the caller to display.
 */
export async function handleServiceError(error: unknown): Promise<Smorekopp<ErrorCode | AuthStatus>> {
    unstableRethrow(error)
    if (!(error instanceof Smorekopp)) throw error
    if (error.errorCode === 'NOT FOUND') notFound()
    if (error.errorCode === 'UNAUTHENTICATED') redirect(await urlWithCallback('/login'))
    if (error.errorCode === 'UNAUTHORIZED') {
        // A user who has not accepted the terms yet is not turned away but sent to finish
        // registration - the same rule redirectOnUnauthorized enforced.
        const session = await ServerSession.fromNextAuth()
        if (session.user && !session.user.acceptedTerms) redirect(await urlWithCallback('/register'))
    }
    return error
}

/**
 * The given url with the current page as callbackUrl, so the user lands back where they
 * were once they are through it. The current path comes from the header stamped by the proxy
 * (src/proxy.ts) - a server component cannot read its own URL. Should the header be
 * missing, the plain url is used.
 */
async function urlWithCallback(url: string) {
    const currentPath = (await headers()).get(CURRENT_PATH_HEADER)
    return currentPath ? `${url}?callbackUrl=${encodeURIComponent(currentPath)}` : url
}

/**
 * Builds a page (and its generateMetadata) from a data-loading operation and a renderer,
 * replacing the old pattern of calling read *actions* at the top of pages and unwrapping
 * their ActionReturn into a thrown error. Pages built with this call service operations
 * directly - the operation callback runs inside a service context seeded with the session
 * of the request, so operations called within it pick the session up automatically.
 *
 * Errors from the operation are handled here, not by the Next.js error boundary:
 * a thrown service error renders `ServiceErrorView` in place of the page (except
 * NOT FOUND -> `notFound()` and UNAUTHENTICATED -> redirect to login). Non-service errors
 * still propagate to the error boundary, since they are bugs rather than expected failures.
 *
 * The title returned by `metadata` is also fed to the PageTitle context, so pages built
 * with this never render `PageTitleSetter` themselves.
 *
 * @param operation - Loads everything the page needs. Runs once per request (shared between
 * the page render and generateMetadata via React `cache`). Throwing a service error inside
 * it sends the user to the error view - wrap non-critical calls in {@link withFallback} when
 * a failure should not take the whole page down.
 * @param authCheckers - Optional record of `can[Something]` keys to authorizer getters.
 * Each getter receives the loaded data and returns a bound authorizer; the results of
 * running them against the session arrive in `render` as `authChecks` under the same keys.
 * @param metadata - Optional Next.js metadata from the loaded data. Titles are plain -
 * the root layout's title template appends the site name.
 * @param render - Renders the page from the loaded data, the auth check results and the session.
 *
 * @example
 * const { page, generateMetadata } = serverPage({
 *     operation: async ({ params }: { params: { username: string } }) =>
 *         userOperations.readProfile({ params: { username: params.username } }),
 *     authCheckers: {
 *         canUpdate: (profile) => userAuth.update.dynamicFields({ username: profile.user.username }),
 *     },
 *     metadata: (profile) => ({ title: profile.user.username }),
 *     render: ({ data, authChecks }) => (
 *         <div>
 *             {data.user.username}
 *             {authChecks.canUpdate.authorized && <EditButton />}
 *         </div>
 *     ),
 * })
 *
 * export default page
 * export { generateMetadata }
 */
export function serverPage<
    Params extends object,
    Data,
    CheckerKeys extends `can${string}` = never,
>({ operation, authCheckers, metadata, render }: {
    operation: (args: PageOperationArgs<Params>) => Promise<Data>,
    authCheckers?: Record<CheckerKeys, (data: Data) => AuthCheckerBound>,
    metadata?: (data: Data) => Metadata,
    render: (args: {
        data: Data,
        authChecks: AuthChecks<CheckerKeys>,
        session: ServerPageSession,
    }) => ReactNode | Promise<ReactNode>,
}): {
    page: (props: PageProps<Params>) => Promise<ReactNode>,
    generateMetadata: (props: PageProps<Params>) => Promise<Metadata>,
} {
    // The operation must run at most once per request even though both the page and
    // generateMetadata need its result. React `cache` memoizes per request, but only on
    // argument identity - and Next does not guarantee that the page and generateMetadata
    // receive identical params/searchParams promise instances. Serializing the resolved
    // (JSON-safe) values gives a stable key to memoize on.
    const serializeProps = async ({ params, searchParams }: PageProps<Params>) =>
        JSON.stringify({ params: await params, searchParams: await searchParams })

    const load = cache(async (serializedProps: string) => {
        const { params, searchParams } = JSON.parse(serializedProps) as {
            params: Params,
            searchParams: SearchParams,
        }
        const session = await ServerSession.fromNextAuth()
        const data = await withServiceContext(
            { session },
            false,
            () => operation({ params, searchParams, session })
        )
        // Object.entries erases the value types (authCheckers may be undefined), so the
        // entries are asserted back to what the signature guarantees they are.
        const checkerEntries = Object.entries(
            authCheckers ?? {}
        ) as [CheckerKeys, (loadedData: Data) => AuthCheckerBound][]
        const authChecks = Object.fromEntries(
            checkerEntries.map(([checkName, authorizerGetter]) => [
                checkName,
                authorizerGetter(data).auth(session),
            ])
        ) as AuthChecks<CheckerKeys>
        return { data, session, authChecks }
    })

    const page = async (props: PageProps<Params>): Promise<ReactNode> => {
        let loaded: Awaited<ReturnType<typeof load>>
        try {
            loaded = await load(await serializeProps(props))
        } catch (error) {
            return <ServiceErrorView error={await handleServiceError(error)} />
        }
        const pageTitle = metadata ? metadata(loaded.data).title : undefined
        return (
            <>
                {typeof pageTitle === 'string' && <PageTitleSetter title={pageTitle} />}
                {await render(loaded)}
            </>
        )
    }

    const generateMetadata = async (props: PageProps<Params>): Promise<Metadata> => {
        if (!metadata) return {}
        let loaded: Awaited<ReturnType<typeof load>>
        try {
            loaded = await load(await serializeProps(props))
        } catch (error) {
            await handleServiceError(error)
            return { title: 'Feil' }
        }
        return metadata(loaded.data)
    }

    return { page, generateMetadata }
}

/**
 * Marks a service operation call inside a serverPage operation as non-critical: if it fails
 * with a service error the given fallback value is returned instead of the failure taking
 * the whole page to the error view. Next.js control-flow errors and non-service errors
 * still propagate.
 *
 * @example
 * operation: async ({ params }) => ({
 *     user: await userOperations.read({ params }),
 *     flairs: await withFallback(flairOperations.readForUser({ params }), []),
 * })
 */
export async function withFallback<Data, Fallback>(
    operationPromise: Promise<Data>,
    fallbackValue: Fallback
): Promise<Data | Fallback> {
    try {
        return await operationPromise
    } catch (error) {
        unstableRethrow(error)
        if (error instanceof Smorekopp) return fallbackValue
        throw error
    }
}

/**
 * For server components that are not pages (layouts, cards rendered inside a page's tree):
 * loads the session of the request and runs the callback inside a service context seeded
 * with it, so service operations called within pick the session up automatically - the same
 * environment a serverPage operation runs in. Errors are not handled here; catch them with
 * {@link handleServiceError} and render `ServiceErrorView`, or let them hit the error boundary.
 */
export async function withPageSession<Result>(
    callback: (session: ServerPageSession) => Promise<Result>
): Promise<Result> {
    const session = await ServerSession.fromNextAuth()
    return withServiceContext({ session }, false, () => callback(session))
}

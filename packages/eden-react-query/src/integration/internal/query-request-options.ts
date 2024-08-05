import type { EdenRequestOptions } from '@elysiajs/eden'
import type { QueryClient } from '@tanstack/react-query'
import type { AnyElysia, MaybePromise } from 'elysia'

/**
 * Options to customize the behavior of the query or fetch.
 */
export type EdenQueryRequestOptions<T extends AnyElysia = AnyElysia> =
  /**
   * Use svelte-query's internal AbortSignals instead of allowing user provided signals.
   */
  Omit<EdenRequestOptions<T>, 'signal'> & {
    /**
     * Opt out or into aborting request on unmount.
     *
     * @todo
     *
     * This should actually be renamed based on {@see https://github.com/trpc/trpc/issues/4448}.
     *
     * TLDR:
     * This property actually means "forward the queryFn's context.signal",
     * which has __more__ functionality than simply aborting the request.
     */
    abortOnUnmount?: boolean

    /**
     * Opt out of SSR for this query by passing `ssr: false`.
     */
    ssr?: boolean

    /**
     * Overrides for svelte-query hooks.
     */
    overrides?: EdenQueryOverrides
  }

/**
 * Top-level overrides applied to the generated eden-query hooks.
 */
export type EdenQueryOverrides = {
  /**
   * Override the default options provided to `useMutation`.
   */
  useMutation?: Partial<UseMutationOverrides>
}

/**
 * Default props that can be provided to the generated `useMutation` hooks.
 */
export type UseMutationOverrides = {
  onSuccess: (opts: {
    /**
     * Calls the original function that was defined in the query's `onSuccess` option
     */
    originalFn: () => MaybePromise<unknown>

    queryClient: QueryClient
    /**
     * Meta data passed in from the `useMutation()` hook
     */
    meta: Record<string, unknown>
  }) => MaybePromise<unknown>
}

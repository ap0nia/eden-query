import type { EdenRequestOptions } from '@elysiajs/eden'
import type { DehydratedState, QueryClient, StoreOrVal } from '@tanstack/svelte-query'
import type { AnyElysia, MaybePromise } from 'elysia'

export type EdenQueryOverrides = {
  createMutation?: Partial<CreateMutationOverride>
}

export type CreateMutationOverride = {
  onSuccess: (opts: {
    originalFn: () => StoreOrVal<unknown>
    meta: Record<string, unknown>
  }) => MaybePromise<unknown>
}

/**
 * Options to customize the behavior of the query or fetch.
 */
export type EdenQueryRequestOptions<T extends AnyElysia = AnyElysia> =
  /**
   * Use svelte-query's internal AbortSignals instead of allowing user provided signals.
   */
  Omit<EdenRequestOptions<T>, 'signal'> & {
    /**
     * Opt out or into aborting request on unmount
     */
    abortOnUnmount?: boolean

    /**
     * Overrides for svelte-query hooks.
     */
    overrides?: EdenQueryOverrides

    /**
     * QueryClient to st
     */
    queryClient?: QueryClient

    /**
     * SSR option...
     */
    dehydrated?: boolean | DehydratedState
  }

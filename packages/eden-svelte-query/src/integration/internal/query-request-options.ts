import type { EdenRequestOptions } from '@ap0nia/eden'
import type { DehydratedState, QueryClient, StoreOrVal } from '@tanstack/svelte-query'
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
     * Opt out or into aborting request on unmount
     */
    abortOnUnmount?: boolean

    /**
     * Overrides for svelte-query hooks.
     */
    overrides?: EdenQueryOverrides

    /**
     * SSR option...
     */
    dehydrated?: boolean | DehydratedState
  }

export type EdenQueryOverrides = {
  createMutation?: Partial<CreateMutationOverride>
}

export type CreateMutationOverride = {
  onSuccess: (options: CreateMutationOverrideOnSuccessOptions) => MaybePromise<unknown>
}

export type CreateMutationOverrideOnSuccessOptions = {
  originalFn: () => StoreOrVal<unknown>

  queryClient: QueryClient

  meta: Record<string, unknown>
}

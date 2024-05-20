import {
  createQuery,
  type CreateQueryOptions,
  type QueriesOptions,
  type QueriesResults,
  type QueryKey,
  type StoreOrVal,
} from '@tanstack/svelte-query'
import type { RouteSchema } from 'elysia'
import { derived, type Readable } from 'svelte/store'

import type { EdenClient } from '../internal/client'
import type { InferRouteError, InferRouteInput, InferRouteOutput } from '../internal/infer'
import {
  createTreatyQueryOptions,
  type EdenCreateQueryOptions,
  type EdenQueryKey,
} from '../internal/query'
import type { EdenRequestOptions } from '../internal/request'
import type { AnyElysia, InstallMessage } from '../types'
import { isStore } from '../utils/is-store'

/**
 * A function that accepts a callback that's called with a proxy object.
 * Invoking the proxy object returns strongly typed query options.
 */
export type EdenCreateQueries<T extends AnyElysia> = <
  TData extends any[],
  TCombinedResult = QueriesResults<TData>,
>(
  callback: (t: EdenCreateQueriesProxy<T>) => {
    queries: StoreOrVal<[...QueriesOptions<TData>]>
    combine?: (result: QueriesResults<TData>) => TCombinedResult
  },
) => Readable<TCombinedResult>

/**
 * A proxy object that returns {@link CreateQueryOptions} (instead of an actual create query result).
 * Passed to `createQueries` caller to use.
 */
export type EdenCreateQueriesProxy<T extends AnyElysia> = T extends {
  _routes: infer TSchema extends Record<string, any>
}
  ? EdenCreateQueriesProxyMapping<TSchema>
  : InstallMessage

/**
 * Implementation.
 */
export type EdenCreateQueriesProxyMapping<
  TSchema extends Record<string, any>,
  TPath extends any[] = [],
> = {
  [K in keyof TSchema]: TSchema[K] extends RouteSchema
    ? CreateQueriesHook<TSchema[K], [...TPath, K]>
    : EdenCreateQueriesProxyMapping<TSchema[K], [...TPath, K]>
}

/**
 * When a route is encountered, it is replaced with a callable function that takes the same inputs.
 */
export type CreateQueriesHook<
  TRoute extends RouteSchema,
  TPath extends any[] = [],
  TInput extends InferRouteInput<TRoute> = InferRouteInput<TRoute>,
  TOutput = InferRouteOutput<TRoute>,
  TError = InferRouteError<TRoute>,
  TKey extends QueryKey = EdenQueryKey<TPath>,
> = (
  input: TInput,
  opts?: Partial<EdenCreateQueryOptions<TOutput, TInput, TError>>,
) => CreateQueryOptions<TOutput, TError, TOutput, TKey>

export function createEdenCreateQueriesProxy<T extends AnyElysia>(
  client: EdenClient,
  config?: EdenRequestOptions,
  paths: any[] = [],
): EdenCreateQueriesProxy<T> {
  const innerProxy: any = new Proxy(() => {}, {
    get: (_, path: string): any => {
      const nextPaths = path === 'index' ? [...paths] : [...paths, path]
      return createEdenCreateQueriesProxy(client, config, nextPaths)
    },
    apply: (_, __, args) => {
      return resolveEdenCreateQueriesProxy(client, config, [...paths], args)
    },
  })

  return innerProxy
}

export function resolveEdenCreateQueriesProxy(
  client: EdenClient,
  config?: EdenRequestOptions,
  paths: string[] = [],
  args: any[] = [],
) {
  const typedOptions = args[0] as StoreOrVal<EdenCreateQueryOptions<any, any, any>>

  if (!isStore(typedOptions)) {
    const queryOptions = createTreatyQueryOptions(client, config, paths, args)
    return createQuery(queryOptions)
  }

  const optionsStore = derived(typedOptions, ($typedOptions) => {
    const newQueryOptions = createTreatyQueryOptions(client, config, paths, [$typedOptions])
    return { ...$typedOptions, ...newQueryOptions }
  })

  return createQuery(optionsStore)
}

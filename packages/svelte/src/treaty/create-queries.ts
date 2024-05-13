import {
  createQuery,
  type CreateQueryOptions,
  type QueryKey,
  type StoreOrVal,
} from '@tanstack/svelte-query'
import type { Elysia, RouteSchema } from 'elysia'
import { derived, type Readable } from 'svelte/store'

import type {
  QueriesOptions,
  QueriesResults,
} from '../../node_modules/@tanstack/svelte-query/dist/createQueries'
import type { EdenQueryConfig } from '../internal/config'
import type { InferRouteError, InferRouteInput, InferRouteOutput } from '../internal/infer'
import {
  createTreatyQueryOptions,
  type EdenCreateQueryOptions,
  type EdenQueryKey,
} from '../internal/query'
import { isStore } from '../utils/is-store'

/**
 * A function that accepts a callback that's called with a proxy object.
 * Invoking the proxy object returns strongly typed query options.
 */
export type EdenCreateQueries<TSchema extends Record<string, any>> = <
  TData extends any[],
  TCombinedResult = QueriesResults<TData>,
>(
  callback: (t: EdenCreateQueriesProxy<TSchema>) => {
    queries: StoreOrVal<[...QueriesOptions<TData>]>
    combine?: (result: QueriesResults<TData>) => TCombinedResult
  },
) => Readable<TCombinedResult>

/**
 * A proxy object that returns {@link CreateQueryOptions} (instead of an actual create query result).
 * Passed to `createQueries` caller to use.
 */
export type EdenCreateQueriesProxy<
  TSchema extends Record<string, any>,
  TPath extends any[] = [],
> = {
  [K in keyof TSchema]: TSchema[K] extends RouteSchema
    ? CreateQueriesHook<TSchema[K], [...TPath, K]>
    : EdenCreateQueriesProxy<TSchema[K], [...TPath, K]>
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
  opts?: Partial<EdenCreateQueryOptions<TRoute, TPath>>,
) => CreateQueryOptions<TOutput, TError, TOutput, TKey>

export function createEdenCreateQueriesProxy<
  TSchema extends Record<string, any>,
  TPath extends any[] = [],
>(
  domain?: string,
  config: EdenQueryConfig = {},
  elysia?: Elysia<any, any, any, any, any, any>,
): EdenCreateQueriesProxy<TSchema, TPath> {
  const paths: any[] = []

  const innerProxy: any = new Proxy(() => {}, {
    get: (_, path: string): any => {
      if (path !== 'index') {
        paths.push(path)
      }
      return innerProxy
    },
    apply: (_, __, args) => {
      return resolveEdenCreateQueriesProxy(args, domain, config, [...paths], elysia)
    },
  })

  return innerProxy
}

export function resolveEdenCreateQueriesProxy(
  args: any[],
  domain?: string,
  config: EdenQueryConfig = {},
  paths: string[] = [],
  elysia?: Elysia<any, any, any, any, any, any>,
) {
  const typedOptions = args[0] as StoreOrVal<EdenCreateQueryOptions<any>>

  if (!isStore(typedOptions)) {
    const queryOptions = createTreatyQueryOptions(paths, args, domain, config, elysia)
    return createQuery(queryOptions)
  }

  const optionsStore = derived(typedOptions, ($typedOptions) => {
    args[0] = $typedOptions
    const newQueryOptions = createTreatyQueryOptions(paths, args, domain, config, elysia)
    return { ...$typedOptions, ...newQueryOptions }
  })

  return createQuery(optionsStore)
}

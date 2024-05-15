import {
  createQuery,
  type CreateQueryOptions,
  type DefaultError,
  type DefinedQueryObserverResult,
  type OmitKeyof,
  type QueriesPlaceholderDataFunction,
  type QueryFunction,
  type QueryKey,
  type QueryObserverLoadingErrorResult,
  type QueryObserverLoadingResult,
  type QueryObserverOptions,
  type QueryObserverPendingResult,
  type SkipToken,
  type StoreOrVal,
  type ThrowOnError,
} from '@tanstack/svelte-query'
import type { Elysia, RouteSchema } from 'elysia'
import { derived, type Readable } from 'svelte/store'

import type { EdenQueryConfig } from '../internal/config'
import type { InferRouteError, InferRouteInput, InferRouteOutput } from '../internal/infer'
import {
  createTreatyQueryOptions,
  type EdenCreateQueryOptions,
  type EdenQueryKey,
} from '../internal/query'
import type { AnyElysia, InstallMessage } from '../types'
import { isStore } from '../utils/is-store'

type MAXIMUM_DEPTH = 20

type GetOptions<T> = T extends {
  queryFnData: infer TQueryFnData
  error?: infer TError
  data: infer TData
}
  ? QueryObserverOptionsForCreateQueries<TQueryFnData, TError, TData>
  : T extends {
      queryFnData: infer TQueryFnData
      error?: infer TError
    }
  ? QueryObserverOptionsForCreateQueries<TQueryFnData, TError>
  : T extends {
      data: infer TData
      error?: infer TError
    }
  ? QueryObserverOptionsForCreateQueries<unknown, TError, TData>
  : T extends [infer TQueryFnData, infer TError, infer TData]
  ? QueryObserverOptionsForCreateQueries<TQueryFnData, TError, TData>
  : T extends [infer TQueryFnData, infer TError]
  ? QueryObserverOptionsForCreateQueries<TQueryFnData, TError>
  : T extends [infer TQueryFnData]
  ? QueryObserverOptionsForCreateQueries<TQueryFnData>
  : T extends {
      queryFn?: QueryFunction<infer TQueryFnData, infer TQueryKey> | SkipToken
      select?: (data: any) => infer TData
      throwOnError?: ThrowOnError<any, infer TError, any, any>
    }
  ? QueryObserverOptionsForCreateQueries<TQueryFnData, TError, TData, TQueryKey>
  : T extends {
      queryFn?: QueryFunction<infer TQueryFnData, infer TQueryKey> | SkipToken
      throwOnError?: ThrowOnError<any, infer TError, any, any>
    }
  ? QueryObserverOptionsForCreateQueries<TQueryFnData, TError, TQueryFnData, TQueryKey>
  : QueryObserverOptionsForCreateQueries

export type QueriesOptions<
  T extends Array<any>,
  TResult extends Array<any> = [],
  TDepth extends ReadonlyArray<number> = [],
> = TDepth['length'] extends MAXIMUM_DEPTH
  ? Array<QueryObserverOptionsForCreateQueries>
  : T extends []
  ? []
  : T extends [infer Head]
  ? [...TResult, GetOptions<Head>]
  : T extends [infer Head, ...infer Tail]
  ? QueriesOptions<[...Tail], [...TResult, GetOptions<Head>], [...TDepth, 1]>
  : Readonly<unknown> extends T
  ? T
  : T extends Array<
      QueryObserverOptionsForCreateQueries<
        infer TQueryFnData,
        infer TError,
        infer TData,
        infer TQueryKey
      >
    >
  ? Array<QueryObserverOptionsForCreateQueries<TQueryFnData, TError, TData, TQueryKey>>
  : Array<QueryObserverOptionsForCreateQueries>

type QueryObserverResult<TData = unknown, TError = DefaultError> =
  | DefinedQueryObserverResult<TData, TError>
  | QueryObserverLoadingErrorResult<TData, TError>
  | QueryObserverLoadingResult<TData, TError>
  | QueryObserverPendingResult<TData, TError>

type QueryObserverOptionsForCreateQueries<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> = OmitKeyof<
  QueryObserverOptions<TQueryFnData, TError, TData, TQueryFnData, TQueryKey>,
  'placeholderData'
> & {
  placeholderData?: TQueryFnData | QueriesPlaceholderDataFunction<TQueryFnData>
}

type GetResults<T> = T extends {
  queryFnData: any
  error?: infer TError
  data: infer TData
}
  ? QueryObserverResult<TData, TError>
  : T extends {
      queryFnData: infer TQueryFnData
      error?: infer TError
    }
  ? QueryObserverResult<TQueryFnData, TError>
  : T extends {
      data: infer TData
      error?: infer TError
    }
  ? QueryObserverResult<TData, TError>
  : T extends [any, infer TError, infer TData]
  ? QueryObserverResult<TData, TError>
  : T extends [infer TQueryFnData, infer TError]
  ? QueryObserverResult<TQueryFnData, TError>
  : T extends [infer TQueryFnData]
  ? QueryObserverResult<TQueryFnData>
  : T extends {
      /**
       * MONKEY PATCH HERE: SkipToken is not included in union.
       */
      queryFn?: QueryFunction<infer TQueryFnData, any> | SkipToken
      select?: (data: any) => infer TData
      throwOnError?: ThrowOnError<any, infer TError, any, any>
    }
  ? QueryObserverResult<
      unknown extends TData ? TQueryFnData : TData,
      unknown extends TError ? DefaultError : TError
    >
  : T extends {
      /**
       * MONKEY PATCH HERE: SkipToken is not included in union.
       */
      queryFn?: QueryFunction<infer TQueryFnData, any> | SkipToken
      throwOnError?: ThrowOnError<any, infer TError, any, any>
    }
  ? QueryObserverResult<TQueryFnData, unknown extends TError ? DefaultError : TError>
  : QueryObserverResult

/**
 * Monkey patched type until fix is merged.
 * @see https://github.com/TanStack/query/pull/7429
 */
type QueriesResults<
  T extends Array<any>,
  TResult extends Array<any> = [],
  TDepth extends ReadonlyArray<number> = [],
> = TDepth['length'] extends MAXIMUM_DEPTH
  ? Array<QueryObserverResult>
  : T extends []
  ? []
  : T extends [infer Head]
  ? [...TResult, GetResults<Head>]
  : T extends [infer Head, ...infer Tail]
  ? QueriesResults<[...Tail], [...TResult, GetResults<Head>], [...TDepth, 1]>
  : T extends Array<
      QueryObserverOptionsForCreateQueries<infer TQueryFnData, infer TError, infer TData, any>
    >
  ? Array<
      QueryObserverResult<
        unknown extends TData ? TQueryFnData : TData,
        unknown extends TError ? DefaultError : TError
      >
    >
  : Array<QueryObserverResult>

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
  opts?: Partial<EdenCreateQueryOptions<TRoute, TPath>>,
) => CreateQueryOptions<TOutput, TError, TOutput, TKey>

export function createEdenCreateQueriesProxy<T extends AnyElysia>(
  domain?: string,
  config: EdenQueryConfig = {},
  elysia?: Elysia<any, any, any, any, any, any>,
): EdenCreateQueriesProxy<T> {
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

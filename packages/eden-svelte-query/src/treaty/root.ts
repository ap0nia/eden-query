import type {
  EdenClient,
  EdenRequestOptions,
  InferRouteBody,
  InferRouteError,
  InferRouteOptions,
  InferRouteOutput,
} from '@elysiajs/eden'
import type {
  HttpMutationMethod,
  HttpQueryMethod,
  HttpSubscriptionMethod,
} from '@elysiajs/eden/http.js'
import {
  type CreateBaseMutationResult,
  type CreateBaseQueryOptions,
  createInfiniteQuery,
  type CreateInfiniteQueryResult,
  type CreateMutationOptions,
  createQuery,
  type CreateQueryResult,
  type DefinedCreateQueryResult,
  type InfiniteData,
  type InitialDataFunction,
  type MutateOptions,
  type SkipToken,
  type StoreOrVal,
} from '@tanstack/svelte-query'
import type { AnyElysia, RouteSchema } from 'elysia'
import type { Prettify } from 'elysia/types'
import { derived, type Readable, readable } from 'svelte/store'

import {
  createEdenInfiniteQueryOptions,
  type EdenCreateInfiniteQueryOptions,
  type ExtractCursorType,
} from '../create-infinite-query'
import {
  createEdenMutation,
  createEdenMutationOptions,
  type EdenCreateMutationOptions,
} from '../create-mutation'
import {
  createEdenQueryOptions,
  type EdenCreateQueryBaseOptions,
  type EdenCreateQueryOptions,
} from '../create-query'
import type { EdenQueryKey } from '../query-key'
import type { EdenQueryRequestOptions } from '../request'
import { isStore } from '../utils/is-store'
import type { DistributiveOmit, Override } from '../utils/types'
import type { InfiniteCursorKey } from './context'

export type EdenDefinedCreateQueryOptions<
  TOutput,
  TData,
  TError,
  TQueryOptsData = TOutput,
> = DistributiveOmit<
  CreateBaseQueryOptions<TOutput, TError, TData, TQueryOptsData, any>,
  'queryKey'
> &
  EdenCreateQueryBaseOptions & {
    initialData: InitialDataFunction<TQueryOptsData> | TQueryOptsData
  }

/**
 * The root proxy maps Elysia._routes to svelte-query hooks.
 */
export type EdenTreatyQueryRoot<T extends AnyElysia> = T extends {
  _routes: infer TSchema extends Record<string, any>
}
  ? EdenTreatyQueryRootMapping<TSchema>
  : 'Please install Elysia before using Eden'

/**
 * Implementation.
 */
export type EdenTreatyQueryRootMapping<
  TSchema extends Record<string, any>,
  TPath extends any[] = [],
> = {
  [K in keyof TSchema]: TSchema[K] extends RouteSchema
    ? TreatyQueryRootMapping<TSchema[K], K, TPath>
    : EdenTreatyQueryRootMapping<TSchema[K], [...TPath, K]>
}

/**
 * Map a {@link RouteSchema} to an object with hooks.
 * @example { createQuery: ..., createInfiniteQuery: ... }
 */
export type TreatyQueryRootMapping<
  TRoute extends RouteSchema,
  TMethod,
  TPath extends any[] = [],
> = TMethod extends HttpQueryMethod
  ? TreatyQueryMapping<TRoute, TPath>
  : TMethod extends HttpMutationMethod
    ? TreatyMutationMapping<TRoute, TPath>
    : TMethod extends HttpSubscriptionMethod
      ? TreatySubscriptionMapping<TRoute, TPath>
      : never

/**
 * Hooks for a query procedure.
 */
export type TreatyQueryMapping<
  TRoute extends RouteSchema,
  TPath extends any[] = [],
  TInput extends InferRouteOptions<TRoute> = InferRouteOptions<TRoute>,
> = {
  createQuery: TreatyCreateQuery<TRoute, TPath>
} & (InfiniteCursorKey extends keyof (TInput['params'] & TInput['query'])
  ? TreatyInfiniteQueryMapping<TRoute, TPath>
  : {})

/**
 * Hooks for an infinite-query procedure.
 */
export type TreatyInfiniteQueryMapping<TRoute extends RouteSchema, TPath extends any[] = []> = {
  createInfiniteQuery: TreatyCreateInfiniteQuery<TRoute, TPath>
}

/**
 * Hooks for a mutation procedure.
 */
export type TreatyMutationMapping<TRoute extends RouteSchema, TPath extends any[] = []> = {
  createMutation: EdenTreatyCreateMutation<TRoute, TPath>
}

/**
 * TODO: Hooks for a subscription procedure.
 */
export type TreatySubscriptionMapping<
  TRoute extends RouteSchema,
  TPath extends any[] = [],
  TInput = InferRouteOptions<TRoute>,
> = {
  options: Prettify<EdenRequestOptions & TInput>
  queryKey: EdenQueryKey<TPath>
}

export interface TreatyCreateQuery<
  TRoute extends RouteSchema,
  _TPath extends any[] = [],
  TInput = InferRouteOptions<TRoute>,
  TOutput = InferRouteOutput<TRoute>,
  TError = InferRouteError<TRoute>,
> {
  <TQueryFnData extends TOutput = TOutput, TData = TQueryFnData>(
    input: StoreOrVal<TInput | SkipToken>,
    options: StoreOrVal<EdenDefinedCreateQueryOptions<TQueryFnData, TData, TError, TOutput>>,
  ): EdenDefinedCreateQueryResult<TData, TError>

  <TQueryFnData extends TOutput = TOutput, TData = TQueryFnData>(
    input: StoreOrVal<TInput | SkipToken>,
    options?: StoreOrVal<EdenCreateQueryOptions<TQueryFnData, TData, TError, TOutput>>,
  ): EdenCreateQueryResult<TData, TError>
}

export type EdenHookResult = {
  eden: {
    path: string
  }
}

export type EdenCreateInfiniteQueryResult<TData, TError, TInput> = CreateInfiniteQueryResult<
  InfiniteData<TData, NonNullable<ExtractCursorType<TInput>> | null>,
  TError
> &
  EdenHookResult

export type EdenCreateQueryResult<TData, TError> = CreateQueryResult<TData, TError> & EdenHookResult

export type EdenDefinedCreateQueryResult<TData, TError> = DefinedCreateQueryResult<TData, TError> &
  EdenHookResult

export type TreatyCreateInfiniteQuery<
  TRoute extends RouteSchema,
  _TPath extends any[] = [],
  TInput = InferRouteOptions<TRoute>,
  TOutput = InferRouteOutput<TRoute>,
  TError = InferRouteError<TRoute>,
> = (
  input: StoreOrVal<TInput | SkipToken>,
  options: StoreOrVal<EdenCreateInfiniteQueryOptions<TInput, TOutput, TError>>,
) => EdenCreateInfiniteQueryResult<TOutput, TError, TInput>

export type EdenTreatyCreateMutation<
  TRoute extends RouteSchema,
  _TPath extends any[] = [],
  TInput = InferRouteBody<TRoute>,
  TOutput = InferRouteOutput<TRoute>,
  TError = InferRouteError<TRoute>,
> = <TContext = unknown>(
  options?: StoreOrVal<EdenCreateMutationOptions<TInput, TOutput, TError, TContext>>,
) => /**
 * TODO: move this to internal query file.
 */
Readable<
  Override<
    CreateBaseMutationResult<TOutput, TError, TInput, TContext>,
    {
      mutateAsync: EdenTreatyAsyncMutationFunction<TRoute>
      mutate: EdenTreatyMutationFunction<TRoute>
    }
  >
>

export type EdenTreatyAsyncMutationFunction<
  TRoute extends RouteSchema,
  _TPath extends any[] = [],
  TInput extends Record<string, any> = InferRouteOptions<TRoute>,
  TBody = TInput['body'],
  TParams = Omit<TInput, 'body'>,
  TOutput = InferRouteOutput<TRoute>,
  TError = InferRouteError<TRoute>,
> = <TContext = unknown>(
  variables: TBody,
  ...args: {} extends TParams
    ? [options?: TParams & MutateOptions<TOutput, TError, TBody, TContext>]
    : [options: TParams & MutateOptions<TOutput, TError, TBody, TContext>]
) => Promise<TOutput>

export type EdenTreatyMutationFunction<
  TRoute extends RouteSchema,
  _TPath extends any[] = [],
  TInput = InferRouteOptions<TRoute>,
  TBody = InferRouteBody<TRoute>,
  TOutput = InferRouteOutput<TRoute>,
  TError = InferRouteError<TRoute>,
> = <TContext = unknown>(
  variables: TBody,
  ...args: {} extends TInput
    ? [options?: TInput & MutateOptions<TOutput, TError, TBody, TContext>]
    : [options: TInput & MutateOptions<TOutput, TError, TBody, TContext>]
) => void

/**
 * Inner proxy. __Does not recursively create more proxies!__
 *
 * Once the first property has been decided from the top-level proxy,
 * future property accesses will mutate a locally scoped array.
 */
export function createEdenTreatyQueryProxyRoot(
  client: EdenClient,
  options?: EdenQueryRequestOptions,
  paths: any[] = [],
): any {
  const innerProxy: any = new Proxy(() => {}, {
    get: (_target, path: string, _receiver): any => {
      const nextPaths = path === 'index' ? [...paths] : [...paths, path]
      return createEdenTreatyQueryProxyRoot(client, options, nextPaths)
    },
    apply: (_target, _thisArg, args) => {
      return resolveEdenTreatyQueryProxy(client, options, [...paths], args)
    },
  })

  return innerProxy
}

/**
 * GET hooks will only have one parameter: options.
 * eden.api.hello.get.createQuery(options)
 *
 * POST, etc. hooks will also only have one parameter: options.
 * They add body when calling `mutate` or `mutateAsync`
 *
 * const mutation = eden.api.hello.post.createMutation(options)
 * mutation.mutate(body)
 */
export function resolveEdenTreatyQueryProxy(
  client: EdenClient,
  options?: EdenQueryRequestOptions,
  originalPaths: string[] = [],
  args: any[] = [],
) {
  const paths = [...originalPaths]

  /**
   * @example 'createQuery'
   */
  const hook = paths.pop()

  switch (hook) {
    case 'createQuery': {
      /**
       * Main input will be provided as first argument.
       */
      const input = args[0] as StoreOrVal<InferRouteOptions>

      /**
       * Additional query options will be provided as the second argument to the `createQuery` call.
       */
      const queryOptions = args[1] as StoreOrVal<EdenCreateQueryOptions<any, any, any>>

      // If both are not stores, then create the query options normally.

      if (!isStore(input) && !isStore(queryOptions)) {
        const treatyQueryOptions = createEdenQueryOptions(client, options, paths, args)
        return createQuery(treatyQueryOptions)
      }

      // Otherwise, convert both to stores and derive the query options.

      const readableInput = isStore(input) ? input : readable(input)
      const readableQueryOptions = isStore(queryOptions) ? queryOptions : readable(queryOptions)

      const treatyQueryOptions = derived(
        [readableInput, readableQueryOptions],
        ([$input, $queryOptions]) => {
          return createEdenQueryOptions(client, options, paths, [$input, $queryOptions])
        },
      )

      return createQuery(treatyQueryOptions)
    }

    case 'createInfiniteQuery': {
      /**
       * Main input will be provided as first argument.
       */
      const input = args[0] as StoreOrVal<InferRouteOptions>

      /**
       * Additional query options will be provided as the second argument to the `createQuery` call.
       */
      const queryOptions = args[1] as StoreOrVal<EdenCreateInfiniteQueryOptions<any, any, any>>

      // If both are not stores, then create the query options normally.

      if (!isStore(input) && !isStore(queryOptions)) {
        const treatyQueryOptions = createEdenInfiniteQueryOptions(client, options, paths, args)
        return createInfiniteQuery(treatyQueryOptions)
      }

      // Otherwise, convert both to stores and derive the query options.

      const readableInput = isStore(input) ? input : readable(input)

      const readableQueryOptions = isStore(queryOptions) ? queryOptions : readable(queryOptions)

      const treatyQueryOptions = derived(
        [readableInput, readableQueryOptions],
        ([$input, $queryOptions]) => {
          return createEdenInfiniteQueryOptions(client, options, paths, [$input, $queryOptions])
        },
      )

      return createInfiniteQuery(treatyQueryOptions)
    }

    case 'createMutation': {
      const mutationOptions = args[0] as StoreOrVal<CreateMutationOptions>

      if (!isStore(mutationOptions)) {
        const treatyMutationOptions = createEdenMutationOptions(client, options, paths, args)
        return createEdenMutation(treatyMutationOptions)
      }

      const treatyMutationOptions = derived(mutationOptions, ($mutationOptions) => {
        return createEdenMutationOptions(client, options, paths, [$mutationOptions])
      })

      return createEdenMutation(treatyMutationOptions)
    }

    default: {
      throw new TypeError(`eden.${paths.join('.')} is not a function`)
    }
  }
}

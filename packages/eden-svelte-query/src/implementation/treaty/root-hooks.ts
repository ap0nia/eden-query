import type { EdenClientError, EdenCreateClient, EdenRequestParams } from '@elysiajs/eden'
import { EdenClient } from '@elysiajs/eden'
import {
  createInfiniteQuery as __createInfiniteQuery,
  type CreateMutationOptions,
  createQueries as __createQueries,
  createQuery as __createQuery,
  skipToken,
  useQueryClient,
} from '@tanstack/svelte-query'
import type { AnyElysia } from 'elysia'
import { getContext as __getContext, setContext as __setContext } from 'svelte'

import type { EdenQueryConfig } from '../../config'
import {
  createUtilityFunctions,
  EDEN_CONTEXT_KEY,
  type EdenContextProps,
  type EdenContextState,
} from '../../context'
import type {
  EdenCreateInfiniteQueryOptions,
  EdenCreateInfiniteQueryResult,
} from '../../integration/hooks/create-infinite-query'
import {
  createEdenMutation,
  type EdenCreateMutationOptions,
  type EdenCreateMutationResult,
  type EdenCreateMutationVariables,
} from '../../integration/hooks/create-mutation'
import type {
  EdenCreateQueryOptions,
  EdenCreateQueryResult,
} from '../../integration/hooks/create-query'
import type { EdenCreateQueryOptionsForCreateQueries } from '../../integration/internal/create-query-options-for-create-queries'
import { parsePathsAndMethod } from '../../integration/internal/parse-paths-and-method'
import { getEdenQueryHookExtension } from '../../integration/internal/query-hook-extension'
import { getMutationKey, getQueryKey } from '../../integration/internal/query-key'
import type { UndefinedInitialDataInfiniteOptions } from '../../integration/patches/undefined-initial-data-infinite-options'
import { isAsyncIterable } from '../../utils/is-async-iterable'
import { createTreatyCreateQueriesProxy, type EdenTreatyCreateQueries } from './create-queries'

export function createEdenTreatyQueryRootHooks<
  TElysia extends AnyElysia,
  TSSRContext = unknown,
  TError = EdenClientError<TElysia>,
>(config?: EdenQueryConfig<TElysia>) {
  type ProviderContext = EdenContextState<TElysia, TSSRContext>

  const createClient: EdenCreateClient<TElysia> = (options) => {
    return new EdenClient(options)
  }

  const createContext = (
    props: EdenContextProps<TElysia, TSSRContext>,
  ): EdenContextState<TElysia, TSSRContext> => {
    const { abortOnUnmount = false, client, queryClient } = props

    const utilityFunctions = createUtilityFunctions({ client, queryClient, abortOnUnmount })

    return {
      abortOnUnmount,
      client,
      queryClient,
      ...utilityFunctions,
    }
  }

  const setContext = (
    props: EdenContextProps<TElysia, TSSRContext>,
  ): EdenContextState<TElysia, TSSRContext> => {
    const context = createContext(props)
    return __setContext(EDEN_CONTEXT_KEY, context)
  }

  const getContext = (): ProviderContext => {
    return __getContext(EDEN_CONTEXT_KEY)
  }

  const createQuery = (
    originalPaths: readonly string[],
    input: any,
    options?: EdenCreateQueryOptions<unknown, unknown, TError>,
  ): EdenCreateQueryResult<unknown, TError> => {
    const context = getContext()

    const { abortOnUnmount, client, queryClient } = context

    const { paths, path, method } = parsePathsAndMethod(originalPaths)

    const queryKey = getQueryKey(paths, input, 'query')

    const defaultOptions = queryClient.getQueryDefaults(queryKey)

    const isInputSkipToken = input === skipToken

    const initialQueryOptions = { ...defaultOptions, ...options }

    const { eden, ...queryOptions } = initialQueryOptions

    const resolvedQueryOptions = { ...queryOptions, queryKey }

    if (isInputSkipToken) {
      resolvedQueryOptions.queryFn = input
    } else {
      const options = input

      resolvedQueryOptions.queryFn = async (queryFunctionContext) => {
        const params: EdenRequestParams = {
          ...config,
          ...eden,
          options,
          path,
          method,
          fetcher: eden?.fetcher ?? config?.fetcher ?? globalThis.fetch,
        }

        const shouldForwardSignal = eden?.abortOnUnmount ?? config?.abortOnUnmount ?? abortOnUnmount

        if (shouldForwardSignal) {
          params.fetch = { ...params.fetch, signal: queryFunctionContext.signal }
        }

        const result = await client.query(params)

        // TODO: how to get async iterable here?

        if (isAsyncIterable(result)) {
          const queryCache = queryClient.getQueryCache()

          const query = queryCache.build(queryFunctionContext.queryKey, { queryKey })

          query.setState({ data: [], status: 'success' })

          const aggregate: unknown[] = []

          for await (const value of result) {
            aggregate.push(value)

            query.setState({ data: [...aggregate] })
          }

          return aggregate
        }

        if (result.error != null) {
          throw result.error
        }

        return result.data
      }
    }

    type HookResult = EdenCreateQueryResult<any, TError>

    const hook = __createQuery(resolvedQueryOptions, queryClient) as HookResult

    hook.eden = getEdenQueryHookExtension({ path: paths })

    return hook
  }

  const createMutation = (
    originalPaths: readonly string[],
    options?: EdenCreateMutationOptions<unknown, TError, unknown, unknown>,
  ): EdenCreateMutationResult<unknown, TError, unknown, unknown, unknown> => {
    const context = getContext()

    const { client } = context

    const queryClient = useQueryClient()

    const { paths, path, method } = parsePathsAndMethod(originalPaths)

    const mutationKey = getMutationKey(paths)

    const mutationDefaults = queryClient.getMutationDefaults(mutationKey)

    const defaultOptions = queryClient.defaultMutationOptions(mutationDefaults)

    const mutationOptions: CreateMutationOptions<unknown, TError, unknown, unknown> = {
      ...options,
      mutationKey: mutationKey,
      mutationFn: async (variables: any = {}) => {
        const { body, options } = variables as EdenCreateMutationVariables

        const params: EdenRequestParams = {
          ...config,
          options,
          body,
          path,
          method,
        }

        const result = await client.query(params)

        if (!('data' in result)) {
          return result
        }

        if (result.error != null) {
          throw result.error
        }

        return result.data
      },
      onSuccess: (data, variables, context) => {
        const onSuccess = options?.onSuccess ?? defaultOptions.onSuccess

        if (config?.overrides?.createMutation?.onSuccess == null) {
          return onSuccess?.(data, variables, context)
        }

        const meta: any = options?.meta ?? defaultOptions.meta

        const originalFn = () => onSuccess?.(data, variables, context)

        return config.overrides.createMutation.onSuccess({ meta, originalFn, queryClient })
      },
    }

    type HookResult = EdenCreateMutationResult<unknown, TError, unknown, unknown, any>

    const hook = createEdenMutation(mutationOptions, queryClient) as HookResult

    hook.eden = getEdenQueryHookExtension({ path: paths })

    return hook
  }

  const createInfiniteQuery = (
    originalPaths: readonly string[],
    input: any,
    options: EdenCreateInfiniteQueryOptions<unknown, unknown, TError>,
  ): EdenCreateInfiniteQueryResult<unknown, TError, unknown> => {
    const context = getContext()

    const { client, queryClient, abortOnUnmount } = context

    const { paths, path, method } = parsePathsAndMethod(originalPaths)

    const queryKey = getQueryKey(path, input, 'infinite')

    const defaultOptions = queryClient.getQueryDefaults(queryKey)

    const initialQueryOptions = { ...defaultOptions, ...options }

    const isInputSkipToken = input === skipToken

    const { eden, ...ssrQueryOptions } = initialQueryOptions

    type InfiniteQueryOptions = UndefinedInitialDataInfiniteOptions<
      unknown,
      TError,
      unknown,
      any,
      unknown
    >

    const queryOptions = {
      ...ssrQueryOptions,
      initialPageParam: ssrQueryOptions.initialCursor ?? null,
      queryKey,
    } as InfiniteQueryOptions

    if (isInputSkipToken) {
      queryOptions.queryFn = input
    } else {
      queryOptions.queryFn = async (queryFunctionContext) => {
        const options = { ...input }

        const params = {
          ...config,
          ...eden,
          options,
          path,
          method,
          fetcher: eden?.fetcher ?? config?.fetcher ?? globalThis.fetch,
        }

        const shouldForwardSignal = eden?.abortOnUnmount ?? config?.abortOnUnmount ?? abortOnUnmount

        if (shouldForwardSignal) {
          params.fetch = { ...params.fetch, signal: queryFunctionContext.signal }
        }

        // FIXME: scuffed way to set cursor. Not sure how to tell if the cursor will be
        // in the route params or query.
        // e.g. /api/pages/:cursor -> /api/pages/1 or /api/pages?cursor=1

        if (queryFunctionContext.pageParam != null) {
          if (params.options.query) {
            ;(params.options.query as any)['cursor'] = queryFunctionContext.pageParam
          } else if (params.options.params) {
            ;(params.options.params as any)['cursor'] = queryFunctionContext.pageParam
          }
        }

        const result = await client.query(params)

        if (result.error != null) {
          throw result.error
        }

        return result.data
      }
    }

    type HookResult = EdenCreateInfiniteQueryResult<unknown, TError, unknown>

    const hook = __createInfiniteQuery(queryOptions, queryClient) as HookResult

    hook.eden = getEdenQueryHookExtension({ path: paths })

    return hook
  }

  const createQueries: EdenTreatyCreateQueries<TElysia> = (queriesCallback) => {
    const context = getContext()

    const { queryClient, client } = context

    const proxy = createTreatyCreateQueriesProxy(client)

    const queries: readonly EdenCreateQueryOptionsForCreateQueries<any, any>[] =
      queriesCallback(proxy)

    return __createQueries({ queries: queries as any }, queryClient) as any
  }

  return {
    createClient,
    createContext,
    setContext,
    getContext,
    createQuery,
    createQueries,
    createMutation,
    createInfiniteQuery,
  }
}

export type EdenTreatyQueryRootHooks<TElysia extends AnyElysia, TSSRContext = unknown> = ReturnType<
  typeof createEdenTreatyQueryRootHooks<TElysia, TSSRContext>
>

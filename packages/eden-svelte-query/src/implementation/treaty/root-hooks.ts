import {
  EdenClient,
  type EdenClientError,
  type EdenCreateClient,
  httpBatchLink,
  type HttpBatchLinkOptions,
  httpLink,
  type HTTPLinkOptions,
  type InferRouteOptions,
  parsePathsAndMethod,
} from '@ap0nia/eden'
import {
  createInfiniteQuery as __createInfiniteQuery,
  createQueries as __createQueries,
  createQuery as __createQuery,
  type SkipToken,
  type StoreOrVal,
  useQueryClient,
} from '@tanstack/svelte-query'
import type { AnyElysia } from 'elysia'
import { getContext as __getContext, setContext as __setContext } from 'svelte'
import { derived, readable } from 'svelte/store'

import type { EdenQueryConfig } from '../../config'
import {
  createUtilityFunctions,
  EDEN_CONTEXT_KEY,
  type EdenContextProps,
  type EdenContextState,
} from '../../context'
import {
  type EdenCreateInfiniteQueryOptions,
  edenCreateInfiniteQueryOptions,
  type EdenCreateInfiniteQueryResult,
} from '../../integration/hooks/create-infinite-query'
import {
  createEdenMutation,
  type EdenCreateMutationOptions,
  edenCreateMutationOptions,
  type EdenCreateMutationResult,
} from '../../integration/hooks/create-mutation'
import {
  type EdenCreateQueryOptions,
  edenCreateQueryOptions,
  type EdenCreateQueryResult,
} from '../../integration/hooks/create-query'
import type { EdenCreateQueryOptionsForCreateQueries } from '../../integration/internal/create-query-options-for-create-queries'
import { getEdenQueryHookExtension } from '../../integration/internal/query-hook-extension'
import { isStore } from '../../utils/is-store'
import {
  createTreatySvelteQueryCreateQueriesProxy,
  type EdenTreatySvelteQueryCreateQueries,
} from './create-queries'
import { createEdenTreatyQueryUtils, type EdenTreatySvelteQueryUtils } from './query-utils'

export function createEdenTreatyQueryRootHooks<
  TElysia extends AnyElysia,
  TSSRContext = unknown,
  TError = EdenClientError<TElysia>,
>(config?: EdenQueryConfig<TElysia>) {
  type ProviderContext = EdenContextState<TElysia, TSSRContext>

  const createClient: EdenCreateClient<TElysia> = (options) => {
    return new EdenClient(options)
  }

  const createHttpClient = (options?: HTTPLinkOptions) => {
    return new EdenClient({
      links: [httpLink(options)],
    })
  }

  /**
   * @warning
   * Ensure that the Elysia.js server uses the batch plugin;
   * the types will not verify whether or not this is detected.
   */
  const createHttpBatchClient = (options?: HttpBatchLinkOptions) => {
    return new EdenClient({
      links: [httpBatchLink(options) as any],
    })
  }

  const createContext = (
    props: EdenContextProps<TElysia, TSSRContext>,
    configOverride = config,
  ): EdenContextState<TElysia, TSSRContext> => {
    const { abortOnUnmount = false, client, queryClient } = props

    const options = { client, queryClient, abortOnUnmount }

    const utilityFunctions = createUtilityFunctions(options, configOverride)

    return {
      abortOnUnmount,
      client,
      queryClient,
      ...utilityFunctions,
    }
  }

  const createUtils = (
    props: EdenContextProps<TElysia, TSSRContext>,
    configOverride = config,
  ): EdenTreatySvelteQueryUtils<TElysia, TSSRContext> => {
    const context = createContext(props, configOverride)
    const utils = createEdenTreatyQueryUtils(context, configOverride)
    return utils
  }

  const setContext = (
    props: EdenContextProps<TElysia, TSSRContext>,
    configOverride = config,
  ): EdenContextState<TElysia, TSSRContext> => {
    const context = createContext(props, configOverride)
    return __setContext(EDEN_CONTEXT_KEY, context)
  }

  const getRawContext = (): ProviderContext => {
    return __getContext(EDEN_CONTEXT_KEY)
  }

  /**
   * tRPC creates a new proxy from the provided context for all `useUtils` calls.
   *
   * @see https://github.com/trpc/trpc/blob/52a57eaa9c12394778abf5f0e6b52ec6f46288ed/packages/react-query/src/createTRPCReact.tsx#L509
   */
  const getContext = (context = getRawContext(), configOverride = config) => {
    return createEdenTreatyQueryUtils(context, configOverride)
  }

  const createQuery = (
    originalPaths: readonly string[],
    input?: StoreOrVal<InferRouteOptions | SkipToken>,
    options?: StoreOrVal<EdenCreateQueryOptions<unknown, unknown, TError>>,
  ): EdenCreateQueryResult<unknown, TError> => {
    const context = getRawContext()

    const parsed = parsePathsAndMethod(originalPaths)

    const queryClient = context.queryClient ?? useQueryClient()

    const edenQueryHookExtension = getEdenQueryHookExtension({ path: parsed.paths })

    type HookResult = EdenCreateQueryResult<any, TError>

    if (!isStore(input) && !isStore(options)) {
      const queryOptions = edenCreateQueryOptions(parsed, context, input, options, config)

      const hook = __createQuery(queryOptions, queryClient) as HookResult

      hook.eden = edenQueryHookExtension

      return hook
    }

    const inputStore = isStore(input) ? input : readable(input)

    const optionsStore = isStore(options) ? options : readable(options)

    const queryOptionsStore = derived([inputStore, optionsStore], ([$input, $options]) => {
      const queryOptions = edenCreateQueryOptions(parsed, context, $input, $options, config)
      return queryOptions
    })

    const hook = __createQuery(queryOptionsStore, queryClient) as HookResult

    hook.eden = edenQueryHookExtension

    return hook
  }

  const createQueries: EdenTreatySvelteQueryCreateQueries<TElysia> = (queriesCallback) => {
    const context = getRawContext()

    const { queryClient, client } = context

    const proxy = createTreatySvelteQueryCreateQueriesProxy(client)

    const queries: readonly EdenCreateQueryOptionsForCreateQueries<any, any>[] =
      queriesCallback(proxy)

    return __createQueries({ queries: queries as any }, queryClient) as any
  }

  const createInfiniteQuery = (
    originalPaths: readonly string[],
    input?: StoreOrVal<InferRouteOptions | SkipToken>,
    options?: StoreOrVal<EdenCreateInfiniteQueryOptions<unknown, unknown, TError>>,
  ): EdenCreateInfiniteQueryResult<unknown, TError, unknown> => {
    const context = getRawContext()

    const parsed = parsePathsAndMethod(originalPaths)

    const queryClient = context.queryClient ?? useQueryClient()

    const edenQueryHookExtension = getEdenQueryHookExtension({ path: parsed.paths })

    type HookResult = EdenCreateInfiniteQueryResult<unknown, TError, unknown>

    if (!isStore(input) && !isStore(options)) {
      const queryOptions = edenCreateInfiniteQueryOptions(parsed, context, input, options, config)

      const hook = __createInfiniteQuery(queryOptions, queryClient) as HookResult

      hook.eden = edenQueryHookExtension

      return hook
    }

    const inputStore = isStore(input) ? input : readable(input)

    const optionsStore = isStore(options) ? options : readable(options)

    const queryOptionsStore = derived([inputStore, optionsStore], ([$input, $options]) => {
      const queryOptions = edenCreateInfiniteQueryOptions(parsed, context, $input, $options, config)
      return queryOptions
    })

    const hook = __createInfiniteQuery(queryOptionsStore, queryClient) as HookResult

    hook.eden = edenQueryHookExtension

    return hook
  }

  const createMutation = (
    originalPaths: readonly string[],
    options?: StoreOrVal<EdenCreateMutationOptions<unknown, TError, unknown, unknown>>,
  ): EdenCreateMutationResult<unknown, TError, unknown, unknown, unknown> => {
    const context = getRawContext()

    const parsed = parsePathsAndMethod(originalPaths)

    const queryClient = context.queryClient ?? useQueryClient()

    const edenQueryHookExtension = getEdenQueryHookExtension({ path: parsed.paths })

    type HookResult = EdenCreateMutationResult<unknown, TError, unknown, unknown, any>

    if (!isStore(options)) {
      const mutationOptions = edenCreateMutationOptions(parsed, context, options, config)

      const hook = createEdenMutation(mutationOptions, queryClient) as HookResult

      hook.eden = edenQueryHookExtension

      return hook
    }

    const optionsStore = isStore(options) ? options : readable(options)

    const mutationOptionsStore = derived(optionsStore, ($options) => {
      const mutationOptions = edenCreateMutationOptions(parsed, context, $options, config)
      return mutationOptions
    })

    const hook = createEdenMutation(mutationOptionsStore, queryClient) as HookResult

    hook.eden = edenQueryHookExtension

    return hook
  }

  return {
    createClient,
    createHttpClient,
    createHttpBatchClient,
    createContext,
    createUtils,
    setContext,
    getContext,
    getUtils: getContext,
    createQuery,
    createQueries,
    createMutation,
    createInfiniteQuery,
  }
}

export type EdenTreatyQueryRootHooks<
  TElysia extends AnyElysia = AnyElysia,
  TSSRContext = unknown,
> = ReturnType<typeof createEdenTreatyQueryRootHooks<TElysia, TSSRContext>>

import { edenFetch } from '@elysiajs/eden'
import type { EdenFetch } from '@elysiajs/eden/fetch'
import { QueryClient } from '@tanstack/svelte-query'
import { Elysia } from 'elysia'
import { getContext, setContext } from 'svelte'

import type { SvelteQueryProxyConfig } from '../internal/options'
import type { TreatyToPath } from '../internal/treaty-to-path'
import type { IsOptional } from '../utils/is-optional'
import { createContext, EDEN_CONTEXT_KEY, type EdenFetchQueryContext } from './context'
import { createHooks, type EdenFetchQueryHooks } from './hooks'

export type EdenFetchQueryConfig = EdenFetch.Config & SvelteQueryProxyConfig

export type EdenFetchQuery<
  TSchema extends Record<string, any>,
  TConfig extends EdenFetchQueryConfig = EdenFetchQueryConfig,
> = EdenFetchQueryHooks<TSchema> &
  (IsOptional<TConfig, 'queryClient'> extends true
    ? {
        context?: EdenFetchQueryContext<TSchema>
      }
    : {
        context: EdenFetchQueryContext<TSchema>
      }) & {
    /**
     * Builder utility to strongly define the config in a second step.
     */
    config: <TNewConfig extends EdenFetchQueryConfig>(
      newConfig: TNewConfig,
    ) => EdenFetchQuery<TSchema, TNewConfig>

    /**
     * Official, initialized {@link edenFetch} instance.
     */
    fetch: EdenFetch.Fn<TSchema>

    /**
     */
    setContext: (queryClient: QueryClient, configOverride?: EdenFetchQueryConfig) => void

    /**
     * Get the utilities from setContext.
     */
    getContext: () => EdenFetchQueryContext<TSchema>

    /**
     * Alias for {@link EdenFetchQuery.createContext}
     */
    useUtils: () => EdenFetchQueryContext<TSchema>
  }

/**
 * TODO: allow passing in an instance of {@link Elysia} for server-side usage.
 */
export function createEdenFetchQuery<
  T extends Elysia<any, any, any, any, any, any, any, any>,
  TConfig extends EdenFetchQueryConfig = EdenFetchQueryConfig,
>(
  server = '',
  config?: EdenFetchQueryConfig,
): T extends {
  _routes: infer TSchema extends Record<string, any>
}
  ? // @ts-expect-error Type 'unknown' is not assignable to type 'Record<string, any>'
    EdenFetchQuery<TreatyToPath<TSchema>, TConfig>
  : 'Please install Elysia before using Eden' {
  const fetch: any = edenFetch(server, config)

  const context = config?.queryClient != null ? createContext(fetch, config) : undefined

  const createContextThunk = () => createContext(fetch, config)

  const getContextThunk = () => {
    return getContext(EDEN_CONTEXT_KEY)
  }

  return {
    config: (newConfig: EdenFetchQueryConfig) => {
      return createEdenFetchQuery(server, { ...config, ...newConfig })
    },
    fetch,
    context,
    createContext: createContextThunk,
    setContext: (queryClient: QueryClient, configOverride?: EdenFetchQueryConfig) => {
      const contextProxy = createContext(fetch, { ...config, queryClient, ...configOverride })
      setContext(EDEN_CONTEXT_KEY, contextProxy)
    },
    getContext: getContextThunk,
    useUtils: getContextThunk,
    ...createHooks(fetch, config),
  } as any
}

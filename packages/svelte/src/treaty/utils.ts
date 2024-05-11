import type {
  CreateMutationOptions,
  FetchInfiniteQueryOptions,
  FetchQueryOptions,
  StoreOrVal,
} from '@tanstack/svelte-query'
import type { Elysia } from 'elysia'
import { get } from 'svelte/store'

import { LOCAL_ADDRESSES } from '../constants'
import { httpMethods } from '../internal/http'
import { getMutationKey, getQueryKey, type QueryType } from '../internal/query'
import { isStore } from '../utils/is-store'
import { resolveTreaty } from './resolve'
import type {
  EdenCreateInfiniteQueryOptions,
  EdenCreateQueryOptions,
  EdenTreatyQueryConfig,
  TreatyConfig,
} from './types'

export function resolveFetchOrigin(domain: string, config: TreatyConfig) {
  if (!config.keepDomain) {
    if (!domain.includes('://')) {
      return (
        (LOCAL_ADDRESSES.find((address) => (domain as string).includes(address))
          ? 'http://'
          : 'https://') + domain
      )
    }

    if (domain.endsWith('/')) {
      return domain.slice(0, -1)
    }
  }

  return domain
}

export function createTreatyQueryOptions(
  paths: string[],
  args: any,
  domain?: string,
  config: EdenTreatyQueryConfig = {},
  elysia?: Elysia<any, any, any, any, any, any>,
): FetchQueryOptions {
  /**
   */
  const pathsCopy: any[] = [...paths]

  /**
   * Only sometimes method, i.e. since invalidations can be partial and not include it.
   * @example 'get'
   */
  const method = pathsCopy[pathsCopy.length - 1]

  if (httpMethods.includes(method)) {
    pathsCopy.pop()
  }

  const abortOnUnmount = Boolean(config?.abortOnUnmount) || Boolean(args[1]?.eden?.abortOnUnmount)

  const typedOptions = args[0] as StoreOrVal<EdenCreateQueryOptions>

  const additionalOptions = args[1]

  const optionsValue = isStore(typedOptions) ? get(typedOptions) : typedOptions

  const { queryOptions, ...rest } = optionsValue

  const baseQueryOptions = {
    queryKey: getQueryKey(pathsCopy, optionsValue, 'query'),
    queryFn: async (context) => {
      const result = await resolveTreaty(
        {
          ...rest,
          method,
          signal: abortOnUnmount ? context.signal : undefined,
        },
        additionalOptions,
        domain,
        config,
        paths,
        elysia,
      )
      return result
    },
    ...queryOptions,
  } satisfies FetchQueryOptions

  return baseQueryOptions
}

export function createTreatyInfiniteQueryOptions(
  paths: string[],
  args: any,
  domain?: string,
  config: EdenTreatyQueryConfig = {},
  elysia?: Elysia<any, any, any, any, any, any>,
): FetchInfiniteQueryOptions {
  /**
   */
  const pathsCopy: any[] = [...paths]

  /**
   * Only sometimes method, i.e. since invalidations can be partial and not include it.
   * @example 'get'
   */
  const method = pathsCopy[pathsCopy.length - 1]

  if (httpMethods.includes(method)) {
    pathsCopy.pop()
  }

  const abortOnUnmount = Boolean(config?.abortOnUnmount) || Boolean(args[1]?.eden?.abortOnUnmount)

  const typedOptions = args[0] as StoreOrVal<EdenCreateInfiniteQueryOptions>

  const optionsValue = isStore(typedOptions) ? get(typedOptions) : typedOptions

  const { queryOptions, ...rest } = optionsValue

  const additionalOptions = args[1]

  const infiniteQueryOptions = {
    queryKey: getQueryKey(pathsCopy, args[0], 'infinite'),
    queryFn: async (context) => {
      const options = { ...optionsValue }

      // FIXME: scuffed way to set cursor.
      if (options.query) {
        options.query['cursor'] = context.pageParam
      }

      if (options.params) {
        options.params['cursor'] = context.pageParam
      }

      const result = await resolveTreaty(
        {
          ...rest,
          method,
          signal: abortOnUnmount ? context.signal : undefined,
        },
        additionalOptions,
        domain,
        config,
        paths,
        elysia,
      )

      return result
    },
    ...queryOptions,
  } satisfies FetchInfiniteQueryOptions

  return infiniteQueryOptions
}

export function createTreatyMutationOptions(
  paths: string[],
  args: any,
  domain?: string,
  config: EdenTreatyQueryConfig = {},
  elysia?: Elysia<any, any, any, any, any, any>,
): CreateMutationOptions {
  /**
   */
  const pathsCopy: any[] = [...paths]

  /**
   * Only sometimes method, i.e. since invalidations can be partial and not include it.
   * @example 'get'
   */
  const method = pathsCopy[pathsCopy.length - 1]

  if (httpMethods.includes(method)) {
    pathsCopy.pop()
  }

  const typedOptions = args[0] as CreateMutationOptions

  const optionsValue = isStore(typedOptions) ? get(typedOptions) : typedOptions

  const mutationOptions = {
    mutationKey: getMutationKey(pathsCopy, optionsValue as any),
    mutationFn: async (customVariables: any = {}) => {
      const { variables, options } = customVariables
      return await resolveTreaty(variables, options, domain, config, paths, elysia)
    },
    onSuccess(data, variables, context) {
      const originalFn = () => optionsValue?.onSuccess?.(data, variables, context)
      return config?.overrides?.createMutation?.onSuccess != null
        ? config.overrides.createMutation.onSuccess({
            meta: optionsValue?.meta as any,
            originalFn,
          })
        : originalFn()
    },
    ...optionsValue,
  } satisfies CreateMutationOptions

  return mutationOptions
}

export function createTreatyQueryKey(paths: string[], anyArgs: any, type: QueryType = 'any') {
  const pathsCopy: any[] = [...paths]

  /**
   * Pop the hook.
   * @example 'fetch', 'invalidate'
   */
  pathsCopy.pop() ?? ''

  /**
   * Only sometimes method, i.e. since invalidations can be partial and not include it.
   * @example 'get'
   */
  const method = pathsCopy[pathsCopy.length - 1]

  if (httpMethods.includes(method)) {
    pathsCopy.pop()
  }

  const queryKey = getQueryKey(pathsCopy, anyArgs[0], type)

  return queryKey
}

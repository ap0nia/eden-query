import {
  createMutation,
  type CreateMutationOptions,
  type CreateMutationResult,
  type DefaultError,
  type FetchInfiniteQueryOptions,
  type FetchQueryOptions,
  type QueryClient,
  type StoreOrVal,
} from '@tanstack/svelte-query'
import type { Elysia, RouteSchema } from 'elysia'
import { derived, get } from 'svelte/store'

import { LOCAL_ADDRESSES } from '../constants'
import { httpMethods } from '../internal/http'
import type { InferRouteOutput } from '../internal/infer'
import type { EdenQueryParams } from '../internal/params'
import { getMutationKey, getQueryKey, type QueryType } from '../internal/query'
import { isStore } from '../utils/is-store'
import { resolveTreaty } from './resolve'
import type {
  EdenCreateInfiniteQueryOptions,
  EdenCreateQueryOptions,
  EdenTreatyQueryConfig,
  TreatyConfig,
} from './types'

/**
 * In order to extend the {@link createMutation} API to allow query/headers to be
 * passed in and forwarded properly, create custom wrapper.
 */
export function createTreatyMutation<
  TData = unknown,
  TError = DefaultError,
  TVariables = void,
  TContext = unknown,
>(
  options: CreateMutationOptions<TData, TError, TVariables, TContext>,
  queryClient?: QueryClient,
): CreateMutationResult<TData, TError, TVariables, TContext> {
  const mutation = createMutation(options, queryClient)

  const customMutation = derived(mutation, ($mutation) => {
    const originalMutateAsync = $mutation.mutateAsync

    $mutation.mutateAsync = async (variables, options = {}) => {
      return await originalMutateAsync({ variables, options } as any, options)
    }

    const originalMutate = $mutation.mutate

    $mutation.mutate = (variables, options = {}) => {
      return originalMutate({ variables, options } as any, options)
    }

    return {
      ...$mutation,
    }
  })

  return customMutation
}

export function createTreatyQueryOptions(
  paths: string[],
  args: any,
  domain?: string,
  config: EdenTreatyQueryConfig = {},
  elysia?: Elysia<any, any, any, any, any, any>,
): FetchQueryOptions {
  /**
   * Only sometimes method, i.e. since invalidations can be partial and not include it.
   * @example 'get'
   */
  let method = paths[paths.length - 1]

  if (httpMethods.includes(method as any)) {
    paths.pop()
  } else {
    method = 'get'
  }

  const typedOptions = args[0] as StoreOrVal<EdenCreateQueryOptions>

  const optionsValue = isStore(typedOptions) ? get(typedOptions) : typedOptions

  const { queryOptions, eden, ...rest } = optionsValue

  const abortOnUnmount = Boolean(config?.abortOnUnmount) || Boolean(eden?.abortOnUnmount)

  const endpoint = '/' + paths.filter((p) => p !== 'index').join('/')

  const baseQueryOptions = {
    queryKey: getQueryKey(paths, optionsValue, 'query'),
    queryFn: async (context) => {
      const result = await resolveTreaty(
        endpoint,
        method,
        {
          ...rest,
          fetch: {
            signal: abortOnUnmount ? context.signal : undefined,
          },
        },
        undefined,
        domain,
        config,
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
   * Only sometimes method, i.e. since invalidations can be partial and not include it.
   * @example 'get'
   */
  let method = paths[paths.length - 1]

  if (httpMethods.includes(method as any)) {
    paths.pop()
  } else {
    method = 'get'
  }

  const abortOnUnmount = Boolean(config?.abortOnUnmount) || Boolean(args[1]?.eden?.abortOnUnmount)

  const typedOptions = args[0] as StoreOrVal<EdenCreateInfiniteQueryOptions>

  const optionsValue = isStore(typedOptions) ? get(typedOptions) : typedOptions

  const { queryOptions, ...rest } = optionsValue

  const additionalOptions = args[1]

  const endpoint = '/' + paths.filter((p) => p !== 'index').join('/')

  const infiniteQueryOptions = {
    queryKey: getQueryKey(paths, args[0], 'infinite'),
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
        endpoint,
        method,
        {
          ...rest,
          fetch: {
            signal: abortOnUnmount ? context.signal : undefined,
          },
        },
        additionalOptions,
        domain,
        config,
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
   * Only sometimes method, i.e. since invalidations can be partial and not include it.
   * @example 'get'
   */
  let method = paths[paths.length - 1]

  if (httpMethods.includes(method as any)) {
    paths.pop()
  } else {
    method = 'get'
  }

  const typedOptions = args[0] as CreateMutationOptions

  const optionsValue = isStore(typedOptions) ? get(typedOptions) : typedOptions

  const endpoint = '/' + paths.filter((p) => p !== 'index').join('/')

  const mutationOptions = {
    mutationKey: getMutationKey(paths, optionsValue as any),
    mutationFn: async (customVariables: any = {}) => {
      const { variables, options } = customVariables
      return await resolveTreaty(endpoint, method, variables, options, domain, config, elysia)
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

export type InferTreatyQueryIO<T extends Elysia<any, any, any, any, any, any, any, any>> =
  T extends {
    _routes: infer TSchema extends Record<string, any>
  }
    ? InferTreatyQueryIOMapping<TSchema>
    : 'Please install Elysia before using Eden'

export type InferTreatyQueryIOMapping<
  TSchema extends Record<string, any>,
  TPath extends any[] = [],
> = {
  [K in keyof TSchema]: TSchema[K] extends RouteSchema
    ? {
        input: EdenQueryParams<Extract<K, string>, TSchema[K]>
        output: InferRouteOutput<TSchema[K]>
      }
    : InferTreatyQueryIOMapping<TSchema[K], [...TPath, K]>
}

export type InferTreatyQueryInput<T extends Elysia<any, any, any, any, any, any, any, any>> =
  T extends {
    _routes: infer TSchema extends Record<string, any>
  }
    ? InferTreatyQueryInputMapping<TSchema>
    : 'Please install Elysia before using Eden'

export type InferTreatyQueryInputMapping<
  TSchema extends Record<string, any>,
  TPath extends any[] = [],
> = {
  [K in keyof TSchema]: TSchema[K] extends RouteSchema
    ? EdenQueryParams<Extract<K, string>, TSchema[K]>
    : InferTreatyQueryInputMapping<TSchema[K], [...TPath, K]>
}

export type InferTreatyQueryOutput<T extends Elysia<any, any, any, any, any, any, any, any>> =
  T extends {
    _routes: infer TSchema extends Record<string, any>
  }
    ? InferTreatyQueryOutputMapping<TSchema>
    : 'Please install Elysia before using Eden'

export type InferTreatyQueryOutputMapping<
  TSchema extends Record<string, any>,
  TPath extends any[] = [],
> = {
  [K in keyof TSchema]: TSchema[K] extends RouteSchema
    ? InferRouteOutput<TSchema[K]>
    : InferTreatyQueryOutputMapping<TSchema[K], [...TPath, K]>
}

import { EdenWS } from '@elysiajs/eden/treaty'
import {
  createQuery,
  type CreateQueryOptions,
  useQueryClient,
  type CreateMutationOptions,
  createMutation,
} from '@tanstack/svelte-query'
import type Elysia from 'elysia'
import { isNumericString } from 'elysia/utils'
import { get, writable } from 'svelte/store'

import { EdenFetchError } from '../internal/error'
import { resolveWsOrigin } from '../internal/http'
import { buildQuery } from '../utils/build-query'
import { createNewFile, hasFile } from '../utils/file'
import { isStore } from '../utils/is-store'
import { getQueryKey } from '../internal/query'
import { FORMAL_DATE_REGEX, IS_SERVER, ISO8601_REGEX, SHORTENED_DATE_REGEX } from '../constants'
import type { EdenRequestOptions, SvelteQueryProxyOptions } from '../internal/options'
import type { Treaty } from './types'

function processHeaders(
  h: Treaty.Config['headers'],
  path: string,
  options: RequestInit = {},
  headers: Record<string, string> = {},
): Record<string, string> {
  if (!h) return headers

  if (Array.isArray(h)) {
    for (const value of h) {
      if (!Array.isArray(value)) {
        headers = processHeaders(value, path, options, headers)
        continue
      }

      const key = value[0]

      if (typeof key === 'string') {
        headers[key.toLowerCase()] = value[1] as string
        continue
      }

      for (const [k = '', value = ''] of key) {
        headers[k.toLowerCase()] = value
      }
    }

    return headers
  }

  switch (typeof h) {
    case 'function': {
      const v = h(path, options)
      return v ? processHeaders(v, path, options, headers) : headers
    }

    case 'object': {
      if (h instanceof Headers) {
        h.forEach((value, key) => {
          headers[key.toLowerCase()] = value
        })
        return headers
      }

      for (const [key, value] of Object.entries(h)) {
        headers[key.toLowerCase()] = value as string
      }

      return headers
    }

    default: {
      return headers
    }
  }
}

/**
 * Resolve a treaty request.
 */
export async function resolveTreatyProxy(
  body: any,
  options: any,
  domain: string,
  config: Treaty.Config,
  paths: string[] = [],
  elysia?: Elysia<any, any, any, any, any, any>,
) {
  const methodPaths = [...paths]
  const method = methodPaths.pop()
  const path = '/' + methodPaths.join('/')

  const fetcher = config.fetcher ?? globalThis.fetch

  const isGetOrHead = method === 'get' || method === 'head' || method === 'subscribe'

  const headers = processHeaders(config.headers, path, options)

  const rawQuery = isGetOrHead ? body?.['query'] : options?.query

  const query = buildQuery(rawQuery)

  if (method === 'subscribe') {
    const wsOrigin = resolveWsOrigin(domain)
    const url = wsOrigin + path + query
    return new EdenWS(url)
  }

  let fetchInit = {
    method: method?.toUpperCase(),
    body,
    ...config.fetch,
    headers,
  } satisfies RequestInit

  fetchInit.headers = {
    ...headers,
    ...processHeaders(
      // For GET and HEAD, options is moved to body (1st param)
      isGetOrHead ? body?.headers : options?.headers,
      path,
      fetchInit,
    ),
  }

  const fetchOpts = isGetOrHead && typeof body === 'object' ? body.fetch : options?.fetch

  fetchInit = {
    ...fetchInit,
    ...fetchOpts,
  }

  if (isGetOrHead) {
    delete fetchInit.body
  }

  config.onRequest ??= []
  if (!Array.isArray(config.onRequest)) {
    config.onRequest = [config.onRequest]
  }

  for (const value of config.onRequest) {
    const temp = await value(path, fetchInit)

    if (typeof temp === 'object')
      fetchInit = {
        ...fetchInit,
        ...temp,
        headers: {
          ...fetchInit.headers,
          ...processHeaders(temp.headers, path, fetchInit),
        },
      }
  }

  /**
   * Repeat because end-user may add a body in {@link config.onRequest}.
   */
  if (isGetOrHead) {
    delete fetchInit.body
  }

  if (hasFile(body)) {
    const formData = new FormData()

    // FormData is 1 level deep
    for (const [key, field] of Object.entries(fetchInit.body)) {
      if (IS_SERVER) {
        formData.append(key, field as any)
        continue
      }

      if (field instanceof File) {
        formData.append(key, await createNewFile(field as any))
        continue
      }

      if (field instanceof FileList) {
        for (const file of field) {
          formData.append(key as any, await createNewFile(file))
        }
        continue
      }

      if (Array.isArray(field)) {
        for (const value of field) {
          formData.append(key, value instanceof File ? await createNewFile(value) : value)
        }
        continue
      }

      formData.append(key, field as string)
    }
  } else if (typeof body === 'object') {
    fetchInit.headers['content-type'] = 'application/json'
    fetchInit.body = JSON.stringify(body)
  } else if (body !== undefined && body !== null) {
    fetchInit.headers['content-type'] = 'text/plain'
  }

  if (isGetOrHead) {
    delete fetchInit.body
  }

  for (const value of config.onRequest) {
    const temp = await value(path, fetchInit)

    if (typeof temp === 'object')
      fetchInit = {
        ...fetchInit,
        ...temp,
        headers: {
          ...fetchInit.headers,
          ...temp.headers,
        } as Record<string, string>,
      }
  }

  const url = domain + path + query
  const response = await (elysia?.handle(new Request(url, fetchInit)) ?? fetcher(url, fetchInit))

  let data = null
  let error = null

  if (config.onResponse) {
    if (!Array.isArray(config.onResponse)) {
      config.onResponse = [config.onResponse]
    }

    for (const value of config.onResponse) {
      try {
        const temp = await value(response.clone())
        if (temp != null) {
          data = temp
          break
        }
      } catch (err) {
        error = err instanceof EdenFetchError ? err : new EdenFetchError(422, err)
        break
      }
    }
  }

  if (data === null) {
    switch (response.headers.get('Content-Type')?.split(';')[0]) {
      case 'application/json':
        data = await response.json()
        break

      case 'application/octet-stream':
        data = await response.arrayBuffer()
        break

      default:
        data = await response.text().then((data) => {
          if (isNumericString(data)) return +data
          if (data === 'true') return true
          if (data === 'false') return false
          if (!data) return data

          // Remove quote from stringified date
          const temp = data.replace(/"/g, '')

          if (
            ISO8601_REGEX.test(temp) ||
            FORMAL_DATE_REGEX.test(temp) ||
            SHORTENED_DATE_REGEX.test(temp)
          ) {
            const date = new Date(temp)
            if (!Number.isNaN(date.getTime())) return date
          }

          return data
        })
    }

    if (response.status >= 300 || response.status < 200) {
      error = new EdenFetchError(response.status, data)
      data = null
    }
  }

  return {
    data,
    error,
    response,
    status: response.status,
    headers: response.headers,
  }
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
export async function resolveQueryTreatyProxy(
  options: any,
  domain: string,
  config: Treaty.Config,
  paths: string[] = [],
  svelteQueryOptions?: SvelteQueryProxyOptions,
  elysia?: Elysia<any, any, any, any, any, any>,
) {
  /**
   * @example ['api', 'hello', 'get', 'createQuery']
   */
  const methodPaths = [...paths]

  /**
   * @example 'createQuery'
   */
  const hook = methodPaths.pop() ?? ''

  /**
   * @example 'get'
   */
  const method = methodPaths.pop() ?? ''

  /**
   * @example '/api/hello'
   */
  const endpoint = '/' + methodPaths.join('/')

  /**
   * {@link EdenRequestOptions} if {@link method} is 'get'.
   * Otherwise the body, and {@link options} is the {@link EdenRequestOptions}.
   */
  const optionsValue = isStore(options) ? get(options) : options

  const abortOnUnmount =
    Boolean(svelteQueryOptions?.abortOnUnmount) || Boolean(optionsValue.eden?.abortOnUnmount)

  const { queryOptions, ...rest } = optionsValue

  switch (hook) {
    case 'createQuery': {
      const { queryOptions, ...rest } = optionsValue

      const baseQueryOptions = {
        queryKey: getQueryKey(endpoint, optionsValue, 'query'),
        // queryFn: async (context) => {
        //   return await fetch(endpoint, {
        //     ...rest,
        //     signal: abortOnUnmount ? context.signal : undefined,
        //   } as EdenRequestOptions)
        // },
        ...queryOptions,
      } satisfies CreateQueryOptions

      if (!isStore(options)) {
        return createQuery(baseQueryOptions as any)
      }

      const optionsStore = writable(baseQueryOptions, (set) => {
        const unsubscribe = options.subscribe((newInput) => {
          const { queryOptions, ...rest } = optionsValue

          set({
            ...baseQueryOptions,
            queryKey: getQueryKey(endpoint, newInput, 'query'),
            // queryFn: async (context) => {
            //   return await fetch(endpoint, {
            //     ...rest,
            //     signal: abortOnUnmount ? context.signal : undefined,
            //   } as EdenRequestOptions)
            // },
            ...queryOptions,
          })
        })

        return unsubscribe
      })

      return createQuery(optionsStore as any)
    }

    // case 'createInfiniteQuery': {
    //   const { queryOptions, ...rest } = optionsValue

    //   const baseQueryOptions = {
    //     queryKey: getQueryKey(endpoint, optionsValue, 'query'),
    //     // queryFn: async (context) => {
    //     //   return await fetch(endpoint, {
    //     //     ...rest,
    //     //     signal: abortOnUnmount ? context.signal : undefined,
    //     //   } as EdenRequestOptions)
    //     // },
    //     ...queryOptions,
    //   } satisfies CreateQueryOptions

    //   if (!isStore(options)) {
    //     return createQuery(baseQueryOptions as any)
    //   }

    //   const optionsStore = writable(baseQueryOptions, (set) => {
    //     const unsubscribe = options.subscribe((newInput) => {
    //       const { queryOptions, ...rest } = optionsValue

    //       set({
    //         ...baseQueryOptions,
    //         queryKey: getQueryKey(endpoint, newInput, 'query'),
    //         // queryFn: async (context) => {
    //         //   return await fetch(endpoint, {
    //         //     ...rest,
    //         //     signal: abortOnUnmount ? context.signal : undefined,
    //         //   } as EdenRequestOptions)
    //         // },
    //         ...queryOptions,
    //       })
    //     })

    //     return unsubscribe
    //   })

    //   return createQuery(optionsStore as any)
    // }

    // case 'createMutation': {
    //   const queryClient = svelteQueryOptions?.svelteQueryContext ?? useQueryClient()
    //   const bodyValue = isStore(options) ? get(options) : options

    //   const baseOptions = {
    //     mutationKey: [endpoint],
    //     // mutationFn: async (variables) => {
    //     //   return await fetch(endpoint, variables)
    //     // },
    //     onSuccess(data, variables, context) {
    //       const originalFn = () => bodyValue?.onSuccess?.(data, variables, context)

    //       return svelteQueryOptions?.overrides?.createMutation?.onSuccess != null
    //         ? svelteQueryOptions.overrides.createMutation.onSuccess({
    //           queryClient,
    //           meta: bodyValue?.meta as any,
    //           originalFn,
    //         })
    //         : originalFn()
    //     },
    //     ...bodyValue,
    //   } satisfies CreateMutationOptions

    //   if (!isStore(options)) {
    //     return createMutation(baseOptions)
    //   }

    //   const optionsStore = writable(baseOptions, (set) => {
    //     const unsubscribe = options.subscribe((newInput) => {
    //       set({
    //         ...baseOptions,
    //         mutationKey: [endpoint],
    //         mutationFn: async (variables) => {
    //           return await fetch(endpoint, variables)
    //         },
    //         onSuccess(data, variables, context) {
    //           const originalFn = () => newInput?.onSuccess?.(data, variables, context)

    //           return svelteQueryOptions?.overrides?.createMutation?.onSuccess != null
    //             ? svelteQueryOptions.overrides.createMutation.onSuccess({
    //               queryClient,
    //               meta: newInput?.meta as any,
    //               originalFn,
    //             })
    //             : originalFn()
    //         },
    //         ...newInput,
    //       })
    //     })

    //     return unsubscribe
    //   })

    //   return createMutation(optionsStore)
    // }

    // TODO: not sure how to handle subscriptions.
    // case 'createSubscription': {
    //   return client.subscription(path, anyArgs[0], anyArgs[1])
    // }

    default: {
      throw new TypeError(`eden.${endpoint}.${hook} is not a function`)
    }
  }
}

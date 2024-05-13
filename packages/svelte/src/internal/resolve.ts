import { EdenWS } from '@elysiajs/eden/treaty'
import type Elysia from 'elysia'
import { isNumericString } from 'elysia/utils'

import { FORMAL_DATE_REGEX, IS_SERVER, ISO8601_REGEX, SHORTENED_DATE_REGEX } from '../constants'
import { EdenFetchError } from '../internal/error'
import { resolveWsOrigin } from '../internal/http'
import { buildQuery } from '../utils/build-query'
import { createNewFile, hasFile } from '../utils/file'
import type { EdenResolveOptions } from './config'

function processHeaders(
  rawHeaders: EdenResolveOptions['headers'],
  path: string,
  options: RequestInit = {},
  headers: Record<string, string> = {},
): Record<string, string> {
  if (!rawHeaders) return headers

  if (Array.isArray(rawHeaders)) {
    for (const value of rawHeaders) {
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

  switch (typeof rawHeaders) {
    case 'function': {
      const v = rawHeaders(path, options)
      return v ? processHeaders(v, path, options, headers) : headers
    }

    case 'object': {
      if (rawHeaders instanceof Headers) {
        rawHeaders.forEach((value, key) => {
          headers[key.toLowerCase()] = value
        })
        return headers
      }

      for (const [key, value] of Object.entries(rawHeaders)) {
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
 */
export async function resolveTreatyRequest(
  /**
   * Endpoint. Can be relative or absolute, as long as the fetcher can handle it.
   *
   * @example
   * '/api/a/b'
   * ['api', 'a', 'b']
   */
  endpointsOrPaths: string | string[],

  /**
   * HTTP method.
   */
  method = 'get',

  /**
   * Options when first parameter of GET request.
   * Body when first parameter of POST, PUT, etc. request.
   */
  bodyOrOptions: any,

  /**
   * Options when second parameter of POST, PUT, etc. request.
   */
  optionsOrUndefined: any,

  /**
   * Domain. Can be undefined if relative endpoint.
   *
   * @example localhost:3000
   */
  domain: string = '',

  /**
   */
  config: EdenResolveOptions = {},

  /**
   */
  elysia?: Elysia<any, any, any, any, any, any>,
) {
  let endpoint = Array.isArray(endpointsOrPaths)
    ? '/' + endpointsOrPaths.filter((p) => p !== 'index').join('/')
    : endpointsOrPaths

  const fetcher = config.fetcher ?? globalThis.fetch

  const isGetOrHead = method === 'get' || method === 'head' || method === 'subscribe'

  const options = isGetOrHead ? bodyOrOptions : optionsOrUndefined

  if (options?.params != null) {
    Object.entries(options.params).forEach(([key, value]) => {
      endpoint = endpoint.replace(`:${key}`, value as string)
    })
  }

  const headers = processHeaders(config.headers, endpoint, options)

  const rawQuery = isGetOrHead ? bodyOrOptions?.['query'] : options?.query

  const query = buildQuery(rawQuery)

  if (method === 'subscribe') {
    const wsOrigin = resolveWsOrigin(domain)
    const url = wsOrigin + endpoint + query
    return new EdenWS(url)
  }

  let fetchInit = {
    method: method?.toUpperCase(),
    body: bodyOrOptions,
    ...config.fetch,
    headers,
  } satisfies RequestInit

  fetchInit.headers = {
    ...headers,
    ...processHeaders(options.headers, endpoint, fetchInit),
  }

  const fetchOpts =
    isGetOrHead && typeof bodyOrOptions === 'object'
      ? bodyOrOptions.fetch
      : optionsOrUndefined?.fetch

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
    const temp = await value(endpoint, fetchInit)

    if (typeof temp === 'object')
      fetchInit = {
        ...fetchInit,
        ...temp,
        headers: {
          ...fetchInit.headers,
          ...processHeaders(temp.headers, endpoint, fetchInit),
        },
      }
  }

  /**
   * Repeat because end-user may add a body in {@link config.onRequest}.
   */
  if (isGetOrHead) {
    delete fetchInit.body
  }

  if (hasFile(bodyOrOptions)) {
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
          formData.append(key, await createNewFile(file))
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
  } else if (typeof bodyOrOptions === 'object') {
    fetchInit.headers['content-type'] = 'application/json'
    fetchInit.body = JSON.stringify(bodyOrOptions)
  } else if (bodyOrOptions !== undefined && bodyOrOptions !== null) {
    fetchInit.headers['content-type'] = 'text/plain'
  }

  if (isGetOrHead) {
    delete fetchInit.body
  }

  for (const value of config.onRequest) {
    const temp = await value(endpoint, fetchInit)

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

  const url = domain + endpoint + query

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

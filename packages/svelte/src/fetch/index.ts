import { EdenWS } from '@elysiajs/eden/treaty'
import { isNumericString } from 'elysia/utils'

import { FORMAL_DATE_REGEX, IS_SERVER, ISO8601_REGEX, SHORTENED_DATE_REGEX } from '../constants'
import type { EdenRequestOptions } from '../internal/config'
import { EdenFetchError } from '../internal/error'
import { resolveWsOrigin } from '../internal/http'
import { buildQuery } from '../utils/build-query'
import { createNewFile, hasFile } from '../utils/file'

export type EdenFetch = any

export function processHeaders(
  rawHeaders: EdenRequestOptions['headers'],
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

export async function parseResponse(response: Response, config: EdenRequestOptions = {}) {
  if (config.onResponse != null) {
    if (!Array.isArray(config.onResponse)) {
      config.onResponse = [config.onResponse]
    }

    for (const value of config.onResponse) {
      try {
        const data = await value(response.clone())
        if (data != null) {
          return { data, error: null, status: response.status }
        }
      } catch (err) {
        const error = err instanceof EdenFetchError ? err : new EdenFetchError(422, err)
        return { data: null, error, status: response.status }
      }
    }
  }

  let data: any

  switch (response.headers.get('Content-Type')?.split(';')[0]) {
    case 'application/json': {
      data = await response.json()
      break
    }

    case 'application/octet-stream': {
      data = await response.arrayBuffer()
      break
    }

    default: {
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
  }

  if (response.status >= 300 || response.status < 200) {
    const error = new EdenFetchError(response.status, data)
    return { data: null, error, status: response.status }
  } else {
    return { data, error: null, status: response.status }
  }
}

export const edenFetch: EdenFetch = async (params) => {
  const config = params.config ?? {}

  let endpoint =
    params.endpoint ?? '/' + (params.paths?.filter((p) => p !== 'index').join('/') ?? '')

  const fetcher = config.fetch ?? globalThis.fetch

  const isGetOrHead =
    params.method == null ||
    params.method === 'get' ||
    params.method === 'head' ||
    params.method === 'subscribe'

  const options = isGetOrHead ? params.bodyOrOptions : params.optionsOrUndefined

  if (options?.params != null) {
    Object.entries(options.params).forEach(([key, value]) => {
      endpoint = endpoint.replace(`:${key}`, value as string)
    })
  }
  const headers = processHeaders(config.headers, endpoint, options)

  const rawQuery = isGetOrHead ? params.bodyOrOptions['query'] : options?.query

  const query = buildQuery(rawQuery)

  if (params.method === 'subscribe') {
    const wsOrigin = resolveWsOrigin(params.domain)
    const url = wsOrigin + endpoint + query
    return new EdenWS(url)
  }

  let fetchInit = {
    method: params.method?.toUpperCase(),
    body: params.bodyOrOptions,
    signal: params.signal,
    ...config.fetchInit,
    headers,
  } satisfies RequestInit

  fetchInit.headers = {
    ...headers,
    ...processHeaders(options?.headers, endpoint, fetchInit),
  }

  const fetchOpts =
    isGetOrHead && typeof params.bodyOrOptions === 'object'
      ? params.bodyOrOptions.fetch
      : params.optionsOrUndefined?.fetch

  fetchInit = {
    ...fetchInit,
    ...fetchOpts,
  }

  if (isGetOrHead) {
    delete fetchInit.body
  }

  if (config.onRequest != null) {
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
  }

  /**
   * Repeat because end-user may add a body in {@link config.onRequest}.
   */
  if (isGetOrHead) {
    delete fetchInit.body
  }

  if (hasFile(params.bodyOrOptions)) {
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
  } else if (params.bodyOrOptions instanceof FormData) {
    // noop.
  } else if (typeof params.bodyOrOptions === 'object') {
    fetchInit.headers['content-type'] = 'application/json'
    fetchInit.body = JSON.stringify(params.bodyOrOptions)
  } else if (params.bodyOrOptions !== null) {
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

  const url = (params.domain ?? '') + endpoint + query

  const response = await (params.elysia?.handle(new Request(url, fetchInit)) ??
    fetcher(url, fetchInit))

  const parsedResponse = await parseResponse(response, config)

  return parsedResponse
}

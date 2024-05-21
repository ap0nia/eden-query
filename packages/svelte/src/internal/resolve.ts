import { isNumericString } from 'elysia/utils'

import { FORMAL_DATE_REGEX, IS_SERVER, ISO8601_REGEX, SHORTENED_DATE_REGEX } from '../constants'
import type { AnyElysia } from '../types'
import { createNewFile, hasFile } from '../utils/file'
import { EdenFetchError } from './error'
import type { InferRouteInput } from './infer'
import type { EdenRequestHeaders, EdenRequestOptions } from './request'

/**
 */
export type EdenRequestParams<T extends AnyElysia = AnyElysia> = EdenRequestOptions<T> & {
  /**
   * Endpoint. Can be relative or absolute, as long as the fetcher can handle it.
   *
   * @example
   * '/api/a/b'
   */
  endpoint?: string

  /**
   * HTTP method.
   */
  method?: string

  /**
   * Options when first parameter of GET request.
   * Body when first parameter of POST, PUT, etc. request.
   */
  input?: InferRouteInput
}

export function parseHeaders(
  rawHeaders: EdenRequestHeaders,
  path: string,
  options: RequestInit = {},
  headers: Record<string, string> = {},
): Record<string, string> {
  if (!rawHeaders) return headers

  if (Array.isArray(rawHeaders)) {
    for (const value of rawHeaders) {
      if (!Array.isArray(value)) {
        headers = parseHeaders(value, path, options, headers)
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
      return v ? parseHeaders(v, path, options, headers) : headers
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

export function parseQuery(query: Record<string, any> = {}): string {
  let q = ''

  if (query) {
    const append = (key: string, value: string) => {
      q += (q ? '&' : '?') + `${encodeURIComponent(key)}=${encodeURIComponent(value)}`
    }

    for (const [key, value] of Object.entries(query)) {
      if (Array.isArray(value)) {
        for (const v of value) append(key, v)
        continue
      }

      append(key, `${value}`)
    }
  }

  return q
}

export async function parseResponse(response: Response, params?: EdenRequestParams) {
  if (params?.onResponse != null) {
    const onResponse = Array.isArray(params.onResponse) ? params.onResponse : [params.onResponse]

    for (const value of onResponse) {
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

export async function resolveEdenRequest(params: EdenRequestParams) {
  let endpoint = params.endpoint ?? ''

  if (params.input?.params != null) {
    Object.entries(params.input?.params).forEach(([key, value]) => {
      endpoint = endpoint.replace(`:${key}`, value as string)
    })
  }

  const providedHeaders = params.input?.headers ?? params.headers

  const headers = parseHeaders(providedHeaders, endpoint, params.fetchInit)

  const query = parseQuery(params.input?.query)

  let fetchInit = {
    method: params.method?.toUpperCase(),
    body: params.input?.body as any,
    ...params.fetchInit,
    headers,
  } satisfies RequestInit

  const isGetOrHead =
    params.method == null ||
    params.method === 'get' ||
    params.method === 'head' ||
    params.method === 'subscribe'

  if (isGetOrHead) {
    delete fetchInit.body
  }

  if (params.onRequest != null) {
    const onRequest = Array.isArray(params.onRequest) ? params.onRequest : [params.onRequest]

    for (const value of onRequest) {
      const temp = await value(endpoint, fetchInit)

      if (typeof temp === 'object') {
        fetchInit = {
          ...fetchInit,
          ...temp,
          headers: {
            ...fetchInit.headers,
            ...parseHeaders(temp?.headers, endpoint, fetchInit),
          },
        }
      }
    }
  }

  /**
   * Repeat because end-user may add a body in {@link config.onRequest}.
   */
  if (isGetOrHead) {
    delete fetchInit.body
  }

  if (!isGetOrHead) {
    if (fetchInit.body instanceof FormData) {
      // noop
    } else if (fetchInit.body != null && hasFile(fetchInit.body)) {
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
    } else if (typeof fetchInit.body === 'object') {
      fetchInit.headers['content-type'] = 'application/json'
      fetchInit.body = JSON.stringify(fetchInit.body)
    } else if (fetchInit.body !== null) {
      fetchInit.headers['content-type'] = 'text/plain'
    }
  }

  const elysia = typeof params.domain === 'string' ? undefined : params.domain

  const url = (typeof params.domain === 'string' ? params.domain : '') + endpoint + query

  const fetch = params.fetch ?? globalThis.fetch

  const response = await (elysia?.handle(new Request(url, fetchInit)) ?? fetch(url, fetchInit))

  const parsedResponse = await parseResponse(response, params)

  return parsedResponse
}

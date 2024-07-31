import type { AnyElysia } from 'elysia'

import type { EdenConfig } from './config'
import { DEMO_DOMAIN, IS_SERVER, LOOPBACK_ADDRESSES } from './constants'
import { EdenFetchError } from './errors'
import type { InferRouteBody, InferRouteOptions } from './infer'
import { getDataTransformer } from './links/internal/transformer'
import type { EdenRequestOptions, EdenResponse } from './request'
import { hasFile } from './utils/file'
import { isGetOrHeadMethod } from './utils/http'
import { parseStringifiedValue } from './utils/parse'
import { EdenWS } from './ws'

function createNewFile(v: File) {
  if (IS_SERVER) {
    return v
  }

  return new Promise<File>((resolve) => {
    const reader = new FileReader()

    reader.onload = () => {
      const filebits = reader.result != null ? [reader.result] : []
      const name = v.name
      const lastModified = v.lastModified
      const type = v.type

      const file = new File(filebits, name, { lastModified, type })

      resolve(file)
    }

    reader.readAsArrayBuffer(v)
  })
}

async function processHeaders(
  configHeaders: EdenConfig['headers'],
  path: string,
  options: RequestInit = {},
  headers: Record<string, string> = {},
): Promise<Record<string, string>> {
  if (Array.isArray(configHeaders)) {
    for (const value of configHeaders)
      if (!Array.isArray(value)) {
        headers = await processHeaders(value, path, options, headers)
      } else {
        const key = value[0]
        if (typeof key === 'string') {
          headers[key.toLowerCase()] = value[1] as string
        } else {
          for (const [k, value] of key) {
            if (k) {
              headers[k.toLowerCase()] = value as string
            }
          }
        }
      }

    return headers
  }

  if (!configHeaders) {
    return headers
  }

  switch (typeof configHeaders) {
    case 'function': {
      if (configHeaders instanceof Headers) {
        return processHeaders(configHeaders, path, options, headers)
      }

      const customHeaders = await configHeaders(path, options)

      if (customHeaders) {
        return processHeaders(customHeaders, path, options, headers)
      }

      return headers
    }

    case 'object': {
      if (configHeaders instanceof Headers) {
        configHeaders.forEach((value, key) => {
          headers[key.toLowerCase()] = value
        })

        return headers
      }

      for (const [key, value] of Object.entries(configHeaders)) {
        headers[key.toLowerCase()] = value
      }

      return headers
    }

    default: {
      return headers
    }
  }
}

export async function* streamResponse(response: Response) {
  const body = response.body

  if (!body) return

  const reader = body.getReader()
  const decoder = new TextDecoder()

  try {
    while (true) {
      const { done, value } = await reader.read()

      if (done) break

      const data = decoder.decode(value)

      yield parseStringifiedValue(data)
    }
  } finally {
    reader.releaseLock()
  }
}

function buildQueryString(query?: any) {
  let q = ''

  if (!query) {
    return q
  }

  for (const [key, value] of Object.entries(query)) {
    if (Array.isArray(value)) {
      for (const v of value) {
        q += (q ? '&' : '?') + `${encodeURIComponent(key)}=${encodeURIComponent(v)}`
      }
    } else if (typeof value === 'object') {
      const stringifiedValue = JSON.stringify(value)
      q += (q ? '&' : '?') + `${encodeURIComponent(key)}=${encodeURIComponent(stringifiedValue)}`
    } else {
      q += (q ? '&' : '?') + `${encodeURIComponent(key)}=${encodeURIComponent(`${value}`)}`
    }
  }

  return q
}

export async function parseResponse<T extends AnyElysia = AnyElysia, TRaw extends boolean = false>(
  response: Response,
  params?: EdenRequestParams<T, TRaw>,
) {
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
    case 'text/event-stream': {
      data = streamResponse(response)
      break
    }

    case 'application/json': {
      data = await response.json()

      const transformer = getDataTransformer(params?.transformer)

      const deserialize = transformer?.output.deserialize

      if (deserialize != null) {
        data = deserialize(data)
      }

      break
    }

    case 'application/octet-stream': {
      data = await response.arrayBuffer()
      break
    }

    case 'multipart/form-data': {
      const temp = await response.formData()

      data = {}

      temp.forEach((value, key) => {
        data[key] = value
      })

      break
    }

    default: {
      data = await response.text().then(parseStringifiedValue)
    }
  }

  if (response.status >= 300 || response.status < 200) {
    const error = new EdenFetchError(response.status, data)
    return { data: null, error, status: response.status }
  } else {
    return { data, error: null, status: response.status }
  }
}

/**
 * Parameters that control how an Eden request is resolved.
 */
export type EdenRequestParams<
  T extends AnyElysia = AnyElysia,
  TRaw extends boolean = false,
> = EdenRequestOptions<T, TRaw> & {
  domain?: T | string
  options?: InferRouteOptions
  body?: InferRouteBody
  path?: string
  method?: string
}

export async function resolveEdenRequest<
  T extends AnyElysia = AnyElysia,
  TRaw extends boolean = false,
>(params: EdenRequestParams<T, TRaw>): Promise<EdenResponse<TRaw> | EdenWS> {
  const path = params.path ?? ''

  const isGetOrHead = isGetOrHeadMethod(params.method)

  const headers = await processHeaders(params.headers, path, params.options?.headers)

  let q = buildQueryString(params.options?.query)

  if (params.method === 'subscribe') {
    const domain = typeof params.domain === 'string' ? params.domain : DEMO_DOMAIN

    const protocol = domain.startsWith('https://')
      ? 'wss://'
      : domain.startsWith('http://')
        ? 'ws://'
        : LOOPBACK_ADDRESSES.find((address) => domain.includes(address))
          ? 'ws://'
          : 'wss://'

    const origin = domain.replace(/^([^]+):\/\//, protocol)

    const url = origin + path + q

    return new EdenWS(url)
  }

  let fetchInit = {
    method: params.method?.toUpperCase(),
    body: params.body as any,
    ...params.fetch,
    headers,
  } satisfies FetchRequestInit

  fetchInit.headers = {
    ...headers,
    ...(await processHeaders(params.options?.headers, path, fetchInit)),
  }

  if (isGetOrHead) {
    delete fetchInit.body
  }

  if (params.onRequest) {
    const onRequest = Array.isArray(params.onRequest) ? params.onRequest : [params.onRequest]

    for (const value of onRequest) {
      const temp = await value(path, fetchInit)

      if (typeof temp === 'object')
        fetchInit = {
          ...fetchInit,
          ...temp,
          headers: {
            ...fetchInit.headers,
            ...(await processHeaders(temp?.headers, path, fetchInit)),
          },
        }
    }
  }

  // ? Duplicate because end-user might add a body in onRequest
  if (isGetOrHead) {
    delete fetchInit.body
  }

  // Don't handle raw FormData if given.
  if (FormData != null && params.body instanceof FormData) {
    // noop
  } else if (hasFile(params.body as any)) {
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
        for (let i = 0; i < field.length; i++)
          formData.append(key as any, await createNewFile((field as any)[i]))

        continue
      }

      if (Array.isArray(field)) {
        for (let i = 0; i < field.length; i++) {
          const value = (field as any)[i]

          formData.append(key as any, value instanceof File ? await createNewFile(value) : value)
        }

        continue
      }

      formData.append(key, field as string)
    }

    // We don't do this because we need to let the browser set the content type with the correct boundary
    // fetchInit.headers['content-type'] = 'multipart/form-data'
    fetchInit.body = formData
  } else if (typeof params.body === 'object') {
    fetchInit.headers['content-type'] = 'application/json'
    fetchInit.body = JSON.stringify(params.body)
  } else if (params.body !== null) {
    fetchInit.headers['content-type'] = 'text/plain'
  }

  if (isGetOrHead) {
    delete fetchInit.body
  }

  if (params.onRequest) {
    const onRequest = Array.isArray(params.onRequest) ? params.onRequest : [params.onRequest]

    for (const value of onRequest) {
      const temp = await value(path, fetchInit)

      if (typeof temp === 'object')
        fetchInit = {
          ...fetchInit,
          ...temp,
          headers: {
            ...fetchInit.headers,
            ...(await processHeaders(temp?.headers, path, fetchInit)),
          } as Record<string, string>,
        }
    }
  }

  const domain = params.domain ?? ''

  const url = domain + path + q

  const elysia = typeof params.domain === 'string' ? undefined : params.domain

  const fetcher = params.fetcher ?? globalThis.fetch

  const response = await (elysia?.handle(new Request(url, fetchInit)) ?? fetcher(url, fetchInit))

  const edenResponse = await parseResponse(response, params)

  if (edenResponse.data !== null) {
    return {
      ...edenResponse,
      ...(params.raw && { response, headers: response.headers, statusText: response.statusText }),
    } as EdenResponse
  }

  if (response.status >= 300 || response.status < 200) {
    edenResponse.error = new EdenFetchError(response.status, edenResponse.data)
    edenResponse.data = null
  }

  return {
    ...edenResponse,
    ...(params.raw && { response, headers: response.headers, statusText: response.statusText }),
  } as EdenResponse
}

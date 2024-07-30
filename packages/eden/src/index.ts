import type { Elysia } from 'elysia'

import { CLIENT_WARNING, IS_SERVER, LOOPBACK_ADDRESSES } from './constants'
import { EdenFetchError } from './errors'
import type { Treaty } from './types'
import { hasFile, isGetOrHeadMethod, isHttpMethod, parseStringifiedValue } from './utils'
// import { EdenWS } from './ws'

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

function processHeaders(
  configHeaders: Treaty.Config['headers'],
  path: string,
  options: RequestInit = {},
  headers: Record<string, string> = {},
): Record<string, string> {
  if (Array.isArray(configHeaders)) {
    for (const value of configHeaders)
      if (!Array.isArray(value)) {
        headers = processHeaders(value, path, options, headers)
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

      const customHeaders = configHeaders(path, options)

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

/**
 * If an object is passed in the middle of a chain as an argument, it's assumed to be a
 * path parameter if there's exactly one key?
 *
 * @see https://elysiajs.com/eden/overview.html#eden-treaty-recommended
 */
function isRequestBody(body?: any) {
  return typeof body === 'object' && Object.keys(body).length !== 1
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

export type AnyElysia = Elysia<any, any, any, any, any, any, any, any>

/**
 * Parameters that control how an Eden request is resolved.
 */
export type EdenRequestParams<T extends AnyElysia = AnyElysia> = Treaty.Config & {
  domain?: T | string
  input?: any
  path?: string
  method?: string
}

async function resolveEdenRequest(params: EdenRequestParams) {
  const path = params.path ?? ''

  const isGetOrHead = isGetOrHeadMethod(params.method)

  const headers = processHeaders(params.headers, path, params.input.headers)

  const query = isGetOrHead ? params.input.body?.['query'] : params.input.query

  let q = buildQueryString(query)

  // if (method === 'subscribe') {
  //   const origin = domain.replace(
  //     /^([^]+):\/\//,
  //     domain.startsWith('https://')
  //       ? 'wss://'
  //       : domain.startsWith('http://')
  //         ? 'ws://'
  //         : LOOPBACK_ADDRESSES.find((address) => domain.includes(address))
  //           ? 'ws://'
  //           : 'wss://',
  //   )

  //   const url = origin + path + q

  //   return new EdenWS(url)
  // }

  let fetchInit = {
    method: params.method?.toUpperCase(),
    body: params.input.body,
    ...params.fetch,
    headers,
  } satisfies FetchRequestInit

  fetchInit.headers = {
    ...headers,
    ...processHeaders(params.input.headers, path, fetchInit),
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
            ...processHeaders(temp.headers, path, fetchInit),
          },
        }
    }
  }

  // ? Duplicate because end-user might add a body in onRequest
  if (isGetOrHead) {
    delete fetchInit.body
  }

  // Don't handle raw FormData if given.
  if (FormData != null && params.input.body instanceof FormData) {
    // noop
  } else if (hasFile(params.input.body)) {
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
  } else if (typeof params.input.body === 'object') {
    fetchInit.headers['content-type'] = 'application/json'
    fetchInit.body = JSON.stringify(params.input.body)
  } else if (params.input.body !== undefined && params.input.body !== null) {
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
            ...processHeaders(temp.headers, path, fetchInit),
          } as Record<string, string>,
        }
    }
  }

  const url = params.domain + path + q

  const elysia = typeof params.domain === 'string' ? undefined : params.domain

  const fetcher = params.fetcher ?? globalThis.fetch

  const response = await (elysia?.handle(new Request(url, fetchInit)) ?? fetcher(url, fetchInit))

  let data: any = null

  let error = null

  if (params.onResponse) {
    const onResponse = Array.isArray(params.onResponse) ? params.onResponse : [params.onResponse]

    for (const value of onResponse)
      try {
        const temp = await value(response.clone())

        if (temp !== undefined && temp !== null) {
          data = temp
          break
        }
      } catch (err) {
        if (err instanceof EdenFetchError) error = err
        else error = new EdenFetchError(422, err)

        break
      }
  }

  if (data !== null) {
    return {
      data,
      error,
      response,
      status: response.status,
      headers: response.headers,
    }
  }

  switch (response.headers.get('Content-Type')?.split(';')[0]) {
    case 'text/event-stream': {
      data = streamResponse(response)
      break
    }

    case 'application/json': {
      data = await response.json()
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
    error = new EdenFetchError(response.status, data)
    data = null
  }

  return {
    data,
    error,
    response,
    status: response.status,
    headers: response.headers,
  }
}

function createProxy(domain: string | Elysia, config: Treaty.Config, paths: string[] = []): any {
  return new Proxy(() => {}, {
    get: (_target, p: string, _receiver): any => {
      return createProxy(domain, config, p === 'index' ? paths : [...paths, p])
    },
    apply: (_target, _thisArg, argArray) => {
      const [body, options] = argArray

      const method = paths.at(-1)

      if (!body || options || isRequestBody(body) || isHttpMethod(method)) {
        const isGetOrHead = isGetOrHeadMethod(method)

        const fetch = {
          ...config.fetch,
          ...(isGetOrHead ? body : options),
        }

        return resolveEdenRequest({
          ...config,
          // options,
          // config,
          fetch,
          domain,
          input: {
            body,
          },
          path: '/' + paths.join('/'),
          method,
        })
      }

      if (typeof body === 'object') {
        return createProxy(domain, config, [...paths, Object.values(body)[0] as string])
      }

      return createProxy(domain, config, paths)
    },
  }) as any
}

export function treaty<const App extends Elysia<any, any, any, any, any, any, any, any>>(
  domain: string | App,
  config: Treaty.Config = {},
): Treaty.Create<App> {
  if (typeof domain === 'string') {
    if (!config.keepDomain) {
      if (!domain.includes('://')) {
        const domainString = domain

        const protocol = LOOPBACK_ADDRESSES.find((address) => domainString.includes(address))
          ? 'http://'
          : 'https://'

        domain = protocol + domain
      }

      if (domain.endsWith('/')) {
        domain = domain.slice(0, -1)
      }
    }

    return createProxy(domain, config)
  }

  if (!IS_SERVER) {
    console.warn(CLIENT_WARNING)
  }

  return createProxy(domain, config, [])
}

export type { Treaty }

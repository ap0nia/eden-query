/* eslint-disable no-extra-semi */
/* eslint-disable no-case-declarations */
/* eslint-disable prefer-const */
import type { Elysia } from 'elysia'

import { CLIENT_WARNING, DEMO_DOMAIN, IS_SERVER, LOOPBACK_ADDRESSES } from './constants'
import { EdenFetchError } from './errors'
import type { Treaty } from './types'
import { hasFile, isHttpMethod, parseStringifiedValue } from './utils'
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

async function resolveEdenRequest(
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

  let { fetcher = fetch, headers, onRequest, onResponse, fetch: conf } = config

  const isGetOrHead = method === 'get' || method === 'head' || method === 'subscribe'

  headers = processHeaders(headers, path, options)

  const query = isGetOrHead
    ? (body as Record<string, string | string[] | undefined>)?.['query']
    : options?.query

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

      if (typeof value === 'object') {
        append(key, JSON.stringify(value))
        continue
      }

      append(key, `${value}`)
    }
  }

  if (method === 'subscribe') {
    const origin = domain.replace(
      /^([^]+):\/\//,
      domain.startsWith('https://')
        ? 'wss://'
        : domain.startsWith('http://')
          ? 'ws://'
          : LOOPBACK_ADDRESSES.find((address) => domain.includes(address))
            ? 'ws://'
            : 'wss://',
    )

    const url = origin + path + q

    return new EdenWS(url)
  }

  let fetchInit = {
    method: method?.toUpperCase(),
    body,
    ...conf,
    headers,
  } satisfies FetchRequestInit

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

  if (onRequest) {
    const onRequestArray = Array.isArray(onRequest) ? onRequest : [onRequest]

    for (const value of onRequestArray) {
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
  if (FormData != null && body instanceof FormData) {
    // noop
  } else if (hasFile(body)) {
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
  } else if (typeof body === 'object') {
    fetchInit.headers['content-type'] = 'application/json'
    fetchInit.body = JSON.stringify(body)
  } else if (body !== undefined && body !== null) {
    fetchInit.headers['content-type'] = 'text/plain'
  }

  if (isGetOrHead) {
    delete fetchInit.body
  }

  if (onRequest) {
    const onRequestArray = Array.isArray(onRequest) ? onRequest : [onRequest]

    for (const value of onRequestArray) {
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

  const url = domain + path + q

  const response = await (elysia?.handle(new Request(url, fetchInit)) ?? fetcher!(url, fetchInit))

  let data: any = null
  let error = null

  if (onResponse) {
    const onResponseArray = Array.isArray(onResponse) ? onResponse : [onResponse]

    for (const value of onResponseArray)
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

function createProxy(
  domain: string,
  config: Treaty.Config,
  paths: string[] = [],
  elysia?: Elysia<any, any, any, any, any, any>,
): any {
  return new Proxy(() => {}, {
    get: (_target, p: string, _receiver): any => {
      return createProxy(domain, config, p === 'index' ? paths : [...paths, p], elysia)
    },
    apply: (_target, _thisArg, argArray) => {
      const [body, options] = argArray

      if (!body || options || isRequestBody(body) || isHttpMethod(paths.at(-1))) {
        return resolveEdenRequest(body, options, domain, config, paths, elysia)
      }

      if (typeof body === 'object') {
        return createProxy(domain, config, [...paths, Object.values(body)[0] as string], elysia)
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

  return createProxy(DEMO_DOMAIN, config, [], domain)
}

export type { Treaty }

import type { Elysia, InputSchema } from 'elysia'

import type { IsNever } from '../utils/is-never'
import type { Prettify } from '../utils/prettify'

type Files = File | FileList

type ReplaceBlobWithFiles<in out RecordType extends Record<string, unknown>> = {
  [K in keyof RecordType]: RecordType[K] extends Blob | Blob[] ? Files : RecordType[K]
} & {}

type MaybeArray<T> = T | T[]

type MaybePromise<T> = T | Promise<T>

type FetchRequestInit = RequestInit

const method = [
  'get',
  'post',
  'put',
  'delete',
  'patch',
  'options',
  'head',
  'connect',
  'subscribe',
] as const

const locals = ['localhost', '127.0.0.1', '0.0.0.0']

const isServer = typeof FileList === 'undefined'

const isISO8601 =
  /(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z))/
const isFormalDate =
  /(?:Sun|Mon|Tue|Wed|Thu|Fri|Sat)\s(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s\d{2}\s\d{4}\s\d{2}:\d{2}:\d{2}\sGMT(?:\+|-)\d{4}\s\([^)]+\)/
const isShortenDate =
  /^(?:(?:(?:(?:0?[1-9]|[12][0-9]|3[01])[/\s-](?:0?[1-9]|1[0-2])[/\s-](?:19|20)\d{2})|(?:(?:19|20)\d{2}[/\s-](?:0?[1-9]|1[0-2])[/\s-](?:0?[1-9]|[12][0-9]|3[01]))))(?:\s(?:1[012]|0?[1-9]):[0-5][0-9](?::[0-5][0-9])?(?:\s[AP]M)?)?$/

const isFile = (v: any) => {
  if (isServer) return v instanceof Blob

  return v instanceof FileList || v instanceof File
}

// FormData is 1 level deep
const hasFile = (obj: Record<string, any>) => {
  if (!obj) return false

  for (const key in obj) {
    if (isFile(obj[key])) return true

    if (Array.isArray(obj[key]) && (obj[key] as unknown[]).find(isFile)) return true
  }

  return false
}

const createNewFile = (v: File) =>
  isServer
    ? v
    : new Promise<File>((resolve) => {
        const reader = new FileReader()

        reader.onload = () => {
          const file = new File([reader.result!], v.name, {
            lastModified: v.lastModified,
            type: v.type,
          })
          resolve(file)
        }

        reader.readAsArrayBuffer(v)
      })

const processHeaders = (
  h: Treaty.Config['headers'],
  path: string,
  options: RequestInit = {},
  headers: Record<string, string> = {},
): Record<string, string> => {
  if (Array.isArray(h)) {
    for (const value of h)
      if (!Array.isArray(value)) headers = processHeaders(value, path, options, headers)
      else {
        const key = value[0]
        if (typeof key === 'string') headers[key.toLowerCase()] = value[1] as string
        else for (const [k, value] of key) headers[k.toLowerCase()] = value as string
      }

    return headers
  }

  if (!h) return headers

  switch (typeof h) {
    case 'function': {
      const v = h(path, options)
      if (v) return processHeaders(v, path, options, headers)
      return headers
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

const createProxy = (
  domain: string,
  config: Treaty.Config,
  paths: string[] = [],
  elysia?: Elysia<any, any, any, any, any, any>,
): any =>
  new Proxy(() => {}, {
    get(_, param: string): any {
      return createProxy(domain, config, param === 'index' ? paths : [...paths, param], elysia)
    },
    apply(_, __, [body, options]) {
      if (
        !body ||
        options ||
        (typeof body === 'object' && Object.keys(body).length !== 1) ||
        method.includes(paths.at(-1) as any)
      ) {
        const methodPaths = [...paths]
        const method = methodPaths.pop()
        const path = '/' + methodPaths.join('/')

        let { fetcher = fetch, headers, onRequest, onResponse, fetch: conf } = config

        const isGetOrHead = method === 'get' || method === 'head' || method === 'subscribe'

        headers = processHeaders(headers, path, options)

        const query = isGetOrHead
          ? (body as Record<string, string | string[] | undefined>)?.query
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

            append(key, `${value}`)
          }
        }

        if (method === 'subscribe') {
          const url =
            domain.replace(
              /^([^]+):\/\//,
              domain.startsWith('https://')
                ? 'wss://'
                : domain.startsWith('http://')
                ? 'ws://'
                : locals.find((v) => (domain as string).includes(v))
                ? 'ws://'
                : 'wss://',
            ) +
            path +
            q

          return new EdenWS(url)
        }

        return (async () => {
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

          if (isGetOrHead) delete fetchInit.body

          if (onRequest) {
            if (!Array.isArray(onRequest)) onRequest = [onRequest]

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
          if (isGetOrHead) delete fetchInit.body

          if (hasFile(body)) {
            const formData = new FormData()

            // FormData is 1 level deep
            for (const [key, field] of Object.entries(fetchInit.body)) {
              if (isServer) {
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

                  formData.append(
                    key as any,
                    value instanceof File ? await createNewFile(value) : value,
                  )
                }

                continue
              }

              formData.append(key, field as string)
            }

            // contentType = 'multipart/form-data'
          } else if (typeof body === 'object') {
            ;(fetchInit.headers as Record<string, string>)['content-type'] = 'application/json'

            fetchInit.body = JSON.stringify(body)
          } else if (body !== undefined && body !== null) {
            ;(fetchInit.headers as Record<string, string>)['content-type'] = 'text/plain'
          }

          if (isGetOrHead) delete fetchInit.body

          if (onRequest) {
            if (!Array.isArray(onRequest)) onRequest = [onRequest]

            for (const value of onRequest) {
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
          }

          const url = domain + path + q
          const response = await (elysia?.handle(new Request(url, fetchInit)) ??
            fetcher!(url, fetchInit))

          let data = null
          let error = null

          if (onResponse) {
            if (!Array.isArray(onResponse)) onResponse = [onResponse]

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

                  if (isISO8601.test(temp) || isFormalDate.test(temp) || isShortenDate.test(temp)) {
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
        })()
      }

      if (typeof body === 'object')
        return createProxy(domain, config, [...paths, Object.values(body)[0] as string], elysia)

      return createProxy(domain, config, paths)
    },
  }) as any

export const treaty = <const App extends Elysia<any, any, any, any, any, any, any, any>>(
  domain: string | App,
  config: Treaty.Config = {},
): Treaty.Create<App> => {
  if (typeof domain === 'string') {
    if (!config.keepDomain) {
      if (!domain.includes('://'))
        domain =
          (locals.find((v) => (domain as string).includes(v)) ? 'http://' : 'https://') + domain

      if (domain.endsWith('/')) domain = domain.slice(0, -1)
    }

    return createProxy(domain, config)
  }

  if (typeof window !== 'undefined')
    console.warn(
      'Elysia instance server found on client side, this is not recommended for security reason. Use generic type instead.',
    )

  return createProxy('http://e.ly', config, [], domain)
}

export type { Treaty }

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Treaty {
  interface TreatyParam {
    fetch?: RequestInit
  }

  export type Create<App extends Elysia<any, any, any, any, any, any, any, any>> = App extends {
    _routes: infer Schema extends Record<string, any>
  }
    ? Prettify<Sign<Schema>>
    : 'Please install Elysia before using Eden'

  export type Sign<in out Route extends Record<string, any>> = {
    [K in keyof Route as K extends `:${string}` ? never : K]: K extends 'subscribe' // ? Websocket route
      ? (undefined extends Route['subscribe']['headers']
          ? { headers?: Record<string, unknown> }
          : {
              headers: Route['subscribe']['headers']
            }) &
          (undefined extends Route['subscribe']['query']
            ? { query?: Record<string, unknown> }
            : {
                query: Route['subscribe']['query']
              }) extends infer Param
        ? {} extends Param
          ? (options?: Param) => EdenWS<Route['subscribe']>
          : (options?: Param) => EdenWS<Route['subscribe']>
        : never
      : Route[K] extends {
          body: infer Body
          headers: infer Headers
          params: any
          query: infer Query
          response: infer Response extends Record<number, unknown>
        }
      ? (undefined extends Headers
          ? { headers?: Record<string, unknown> }
          : {
              headers: Headers
            }) &
          (undefined extends Query
            ? { query?: Record<string, unknown> }
            : { query: Query }) extends infer Param
        ? {} extends Param
          ? undefined extends Body
            ? K extends 'get' | 'head'
              ? (options?: Prettify<Param & TreatyParam>) => Promise<TreatyResponse<Response>>
              : (
                  body?: Body,
                  options?: Prettify<Param & TreatyParam>,
                ) => Promise<TreatyResponse<Response>>
            : (
                body: Body extends Record<string, unknown> ? ReplaceBlobWithFiles<Body> : Body,
                options?: Prettify<Param & TreatyParam>,
              ) => Promise<TreatyResponse<Response>>
          : K extends 'get' | 'head'
          ? (options: Prettify<Param & TreatyParam>) => Promise<TreatyResponse<Response>>
          : (
              body: Body extends Record<string, unknown> ? ReplaceBlobWithFiles<Body> : Body,
              options: Prettify<Param & TreatyParam>,
            ) => Promise<TreatyResponse<Response>>
        : never
      : CreateParams<Route[K]>
  }

  type CreateParams<Route extends Record<string, any>> = Extract<
    keyof Route,
    `:${string}`
  > extends infer Path extends string
    ? IsNever<Path> extends true
      ? Prettify<Sign<Route>>
      : // ! DO NOT USE PRETTIFY ON THIS LINE, OTHERWISE FUNCTION CALLING WILL BE OMITTED
        ((params: {
          [param in Path extends `:${infer Param}` ? Param : never]: string | number
        }) => Prettify<Sign<Route[Path]>> & CreateParams<Route[Path]>) &
          Prettify<Sign<Route>>
    : never

  export interface Config {
    fetch?: Omit<RequestInit, 'headers' | 'method'>
    fetcher?: typeof fetch
    headers?: MaybeArray<
      | RequestInit['headers']
      | ((path: string, options: RequestInit) => RequestInit['headers'] | void)
    >
    onRequest?: MaybeArray<
      (path: string, options: FetchRequestInit) => MaybePromise<FetchRequestInit | void>
    >
    onResponse?: MaybeArray<(response: Response) => MaybePromise<unknown>>
    keepDomain?: boolean
  }

  type TreatyResponse<Res extends Record<number, unknown>> =
    | {
        data: Res[200]
        error: null
        response: Response
        status: number
        headers: FetchRequestInit['headers']
      }
    | {
        data: null
        error: Exclude<keyof Res, 200> extends never
          ? {
              status: unknown
              value: unknown
            }
          : {
              [Status in keyof Res]: {
                status: Status
                value: Res[Status]
              }
            }[Exclude<keyof Res, 200>]
        response: Response
        status: number
        headers: FetchRequestInit['headers']
      }

  export interface OnMessage<Data = unknown> extends MessageEvent {
    data: Data
    rawData: MessageEvent['data']
  }

  export type WSEvent<K extends keyof WebSocketEventMap, Data = unknown> = K extends 'message'
    ? OnMessage<Data>
    : WebSocketEventMap[K]
}

export class EdenWS<in out Schema extends InputSchema<any> = {}> {
  ws: WebSocket

  constructor(public url: string) {
    this.ws = new WebSocket(url)
  }

  send(data: Schema['body'] | Schema['body'][]) {
    if (Array.isArray(data)) {
      data.forEach((datum) => this.send(datum))

      return this
    }

    this.ws.send(typeof data === 'object' ? JSON.stringify(data) : data.toString())

    return this
  }

  on<K extends keyof WebSocketEventMap>(
    type: K,
    listener: (event: Treaty.WSEvent<K, Schema['response']>) => void,
    options?: boolean | AddEventListenerOptions,
  ) {
    return this.addEventListener(type, listener, options)
  }

  off<K extends keyof WebSocketEventMap>(
    type: K,
    listener: (this: WebSocket, ev: WebSocketEventMap[K]) => any,
    options?: boolean | EventListenerOptions,
  ) {
    this.ws.removeEventListener(type, listener, options)

    return this
  }

  subscribe(
    onMessage: (event: Treaty.WSEvent<'message', Schema['response']>) => void,
    options?: boolean | AddEventListenerOptions,
  ) {
    return this.addEventListener('message', onMessage, options)
  }

  addEventListener<K extends keyof WebSocketEventMap>(
    type: K,
    listener: (event: Treaty.WSEvent<K, Schema['response']>) => void,
    options?: boolean | AddEventListenerOptions,
  ) {
    this.ws.addEventListener(
      type,
      (ws) => {
        if (type === 'message') {
          let data = (ws as MessageEvent).data.toString() as any
          const start = data.charCodeAt(0)

          if (start === 47 || start === 123)
            try {
              data = JSON.parse(data)
            } catch {
              // Not Empty
            }
          else if (isNumericString(data)) data = +data
          else if (data === 'true') data = true
          else if (data === 'false') data = false

          listener({
            ...ws,
            data,
          } as any)
        } else listener(ws as any)
      },
      options,
    )

    return this
  }

  removeEventListener<K extends keyof WebSocketEventMap>(
    type: K,
    listener: (this: WebSocket, ev: WebSocketEventMap[K]) => any,
    options?: boolean | EventListenerOptions,
  ) {
    this.off(type, listener, options)

    return this
  }

  close() {
    this.ws.close()

    return this
  }
}

export function isNumericString(message: string) {
  return message.trim().length !== 0 && !Number.isNaN(Number(message))
}

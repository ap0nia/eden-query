import type { EdenWS } from '@elysiajs/eden/treaty'
import type {
  CreateInfiniteQueryOptions,
  CreateInfiniteQueryResult,
  CreateMutationOptions,
  CreateMutationResult,
  CreateQueryOptions,
  CreateQueryResult,
  InfiniteData,
  StoreOrVal,
} from '@tanstack/svelte-query'
import { Elysia } from 'elysia'
import type { MaybeArray, MaybePromise, Prettify } from 'elysia/types'

import type { HttpMutationMethod, HttpQueryMethod, HttpSubscriptionMethod } from '../internal/http'
import type { InfiniteInput } from '../internal/infinite'
import type { IsNever } from '../utils/is-never'

type Files = File | FileList

type ReplaceBlobWithFiles<in out RecordType extends Record<string, unknown>> = {
  [K in keyof RecordType]: RecordType[K] extends Blob | Blob[] ? Files : RecordType[K]
} & {}

const e = new Elysia().get('/i/:cursor', () => 'Hi').post('/a/c', () => 123)
// .delete('/delete', () => true)

/**
 * @type {TFetchFn} the function.
 * @type {TMethod} the actual method.
 */
export type MapHook<TFetchFn, TMethod> = TFetchFn extends ((
  ...args: [infer BodyOrOptions, infer OptionsOrUndefined]
) => infer Response extends Record<number, unknown>)
  ? TMethod extends HttpQueryMethod
    ? {
        createQuery: (
          options: StoreOrVal<
            BodyOrOptions & {
              queryOptions?: Omit<
                CreateQueryOptions<
                  TreatyData<Response>,
                  TreatyError<Response>,
                  TreatyData<Response>,
                  [TMethod /* TODO calculate query key? */, BodyOrOptions]
                >,
                'queryKey'
              >
            }
          >,
        ) => CreateQueryResult<TreatyData<Response>, TreatyError<Response>>
      } & (BodyOrOptions extends InfiniteInput<infer _FetchOptions>
        ? {
            createInfiniteQuery: (
              options: StoreOrVal<
                BodyOrOptions & {
                  queryOptions: Omit<
                    CreateInfiniteQueryOptions<
                      TreatyData<Response>,
                      TreatyError<Response>,
                      TreatyData<Response>,
                      [TMethod /* TODO calculate query key? */, BodyOrOptions]
                    >,
                    'queryKey'
                  >
                }
              >,
            ) => CreateInfiniteQueryResult<
              InfiniteData<TreatyData<Response>>,
              TreatyError<Response>
            >
          }
        : never)
    : TMethod extends HttpMutationMethod
    ? {
        createMutation: (
          options?: CreateMutationOptions<
            TreatyData<Response>,
            TreatyError<Response>,
            BodyOrOptions,
            any
          >,
        ) => CreateMutationResult<TreatyData<Response>, TreatyError<Response>, BodyOrOptions, any>
      }
    : TMethod extends HttpSubscriptionMethod
    ? {
        body: BodyOrOptions
        options: OptionsOrUndefined
        output: Response
        createSubscription: TFetchFn
      }
    : Decorate<ReturnType<TFetchFn>>
  : // Terminate early if the fetch function cannot be inferred.
    never

export type Decorate<T extends Record<string, any>> = {
  [K in keyof T]: T[K] extends (...args: any) => any ? MapHook<T[K], K> : Decorate<T[K]>
}

export type DecoratedBaseTreaty = Prettify<Decorate<Treaty.Sign<(typeof e)['_routes']>>>

export type A = (typeof e)['_routes']

export type O = Treaty.Sign<typeof e>['_routes']

export type N = DecoratedBaseTreaty['i']

export type P = O['a']['c']['post']

export type S = DecoratedBaseTreaty['i'][':cursor']['get']['createInfiniteQuery']

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Treaty {
  interface TreatyOptions {
    fetch?: RequestInit
  }

  export type Create<App extends Elysia<any, any, any, any, any, any, any, any>> = App extends {
    _routes: infer Schema extends Record<string, any>
  }
    ? Prettify<Sign<Schema>>
    : 'Please install Elysia before using Eden'

  export type Sign<in out Route extends Record<string, any>> = {
    [K in keyof Route as K extends `:${string}` ? never : K]: K extends 'subscribe'
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
          params: infer TParams
          query: infer Query
          response: infer Response extends Record<number, unknown>
        }
      ? (undefined extends Headers
          ? { headers?: Record<string, unknown> }
          : {
              headers: Headers
            }) &
          (undefined extends Query ? { query?: Record<string, unknown> } : { query: Query }) &
          (undefined extends TParams
            ? { params?: Record<string, unknown> }
            : { params: TParams }) extends infer TOptions
        ? {} extends TOptions
          ? undefined extends Body
            ? K extends 'get' | 'head'
              ? (options?: Prettify<TOptions & TreatyOptions>) => Response
              : (body?: Body, options?: Prettify<TOptions & TreatyOptions>) => Response
            : (
                body: Body extends Record<string, unknown> ? ReplaceBlobWithFiles<Body> : Body,
                options?: Prettify<TOptions & TreatyOptions>,
              ) => Response
          : K extends 'get' | 'head'
          ? (options: Prettify<TOptions & TreatyOptions>) => Response
          : (
              body: Body extends Record<string, unknown> ? ReplaceBlobWithFiles<Body> : Body,
              options: Prettify<TOptions & TreatyOptions>,
            ) => Response
        : never
      : CreateParams<Route[K]>
  }

  type CreateParams<Route extends Record<string, any>> = Extract<
    keyof Route,
    `:${string}`
  > extends infer Path extends string
    ? IsNever<Path> extends true
      ? Prettify<Sign<Route>>
      : {
          [Param in Path]: Prettify<Sign<Route[Path]>> & CreateParams<Route[Path]>
        }
    : never

  export interface Config {
    fetch?: Omit<RequestInit, 'headers' | 'method'>
    fetcher?: typeof fetch
    headers?: MaybeArray<
      | RequestInit['headers']
      | ((path: string, options: RequestInit) => RequestInit['headers'] | void)
    >
    onRequest?: MaybeArray<(path: string, options: RequestInit) => MaybePromise<RequestInit | void>>
    onResponse?: MaybeArray<(response: Response) => MaybePromise<unknown>>
    keepDomain?: boolean
  }

  export interface OnMessage<Data = unknown> extends MessageEvent {
    data: Data
    rawData: MessageEvent['data']
  }

  export type WSEvent<K extends keyof WebSocketEventMap, Data = unknown> = K extends 'message'
    ? OnMessage<Data>
    : WebSocketEventMap[K]
}

type TreatyData<Res extends Record<number, unknown>> = {
  data: Res[200]
  error: null
  response: Response
  status: number
  headers: RequestInit['headers']
}

type TreatyError<Res extends Record<number, unknown>> = {
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
  headers: RequestInit['headers']
}

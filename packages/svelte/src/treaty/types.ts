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
import type { RouteSchema, Prettify } from 'elysia/types'
import type { HttpMutationMethod, HttpQueryMethod, HttpSubscriptionMethod } from '../internal/http'
import type { InfiniteInput } from '../internal/infinite'
import type { EdenQueryParams, EdenSubscribeParams } from '../internal/params'
import type { Join, Stringable } from '../utils/join'

/**
 * Additional options available for the `treaty` variant of eden.
 */
export interface TreatyBaseOptions {
  fetch?: RequestInit
}

const e = new Elysia()
  .get('/i/:cursor', (context) => {
    return true ? context.error('Locked') : 'hi'
  })
  .post('/a/c', () => 123)

export type A = (typeof e)['_routes']['i'][':cursor']['get']['response']

export type O = Treaty.Sign<(typeof e)['_routes']>['i'][':cursor']['get']

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Treaty {
  export type Create<App extends Elysia<any, any, any, any, any, any, any, any>> = App extends {
    _routes: infer Schema extends Record<string, any>
  }
    ? Prettify<Sign<Schema>>
    : 'Please install Elysia before using Eden'

  export type Sign<in out Route extends Record<string, any>> = {
    [K in keyof Route]: K extends 'subscribe'
      ? EdenSubscribeParams<Route[K]>
      : Route[K] extends RouteSchema
      ? Prettify<TreatyBaseOptions & EdenQueryParams<any, Route[K]>>
      : Sign<Route[K]>
  }
}

/**
 * Calculates the query key.
 */
export type TreatyQueryKey<T extends Stringable[] = []> = Join<T, '/', '/'>

/**
 */
export type TreatyData<TResponse extends Record<number, unknown>> = {
  data: TResponse[200]
  error: null
  response: Response
  status: number
  headers: RequestInit['headers']
}

/**
 */
export type TreatyError<TResponse extends Record<number, unknown>> = {
  data: null
  error: Exclude<keyof TResponse, 200> extends never
    ? {
        status: unknown
        value: unknown
      }
    : {
        [Status in keyof TResponse]: {
          status: Status
          value: TResponse[Status]
        }
      }[Exclude<keyof TResponse, 200>]
  response: Response
  status: number
  headers: RequestInit['headers']
}

// /**
//  * @type {TFetchFn} the function.
//  * @type {TMethod} the actual method.
//  */
// export type MapHook<TFetchFn, TMethod> = TFetchFn extends ((
//   ...args: [infer BodyOrOptions, infer OptionsOrUndefined]
// ) => infer Response extends Record<number, unknown>)
//   ? TMethod extends HttpQueryMethod
//     ? {
//         createQuery: (
//           options: StoreOrVal<
//             BodyOrOptions & {
//               queryOptions?: Omit<
//                 CreateQueryOptions<
//                   TreatyData<Response>,
//                   TreatyError<Response>,
//                   TreatyData<Response>,
//                   [TMethod /* TODO calculate query key? */, BodyOrOptions]
//                 >,
//                 'queryKey'
//               >
//             }
//           >,
//         ) => CreateQueryResult<TreatyData<Response>, TreatyError<Response>>
//       } & (BodyOrOptions extends InfiniteInput<infer _FetchOptions>
//         ? {
//             createInfiniteQuery: (
//               options: StoreOrVal<
//                 BodyOrOptions & {
//                   queryOptions: Omit<
//                     CreateInfiniteQueryOptions<
//                       TreatyData<Response>,
//                       TreatyError<Response>,
//                       TreatyData<Response>,
//                       [TMethod /* TODO calculate query key? */, BodyOrOptions]
//                     >,
//                     'queryKey'
//                   >
//                 }
//               >,
//             ) => CreateInfiniteQueryResult<
//               InfiniteData<TreatyData<Response>>,
//               TreatyError<Response>
//             >
//           }
//         : never)
//     : TMethod extends HttpMutationMethod
//     ? {
//         createMutation: (
//           options?: CreateMutationOptions<
//             TreatyData<Response>,
//             TreatyError<Response>,
//             BodyOrOptions,
//             any
//           >,
//         ) => CreateMutationResult<TreatyData<Response>, TreatyError<Response>, BodyOrOptions, any>
//       }
//     : TMethod extends HttpSubscriptionMethod
//     ? {
//         body: BodyOrOptions
//         options: OptionsOrUndefined
//         output: Response
//         createSubscription: TFetchFn
//       }
//     : never
//   : never
//

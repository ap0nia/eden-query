// import type { CreateInfiniteQueryOptions, CreateQueryOptions } from '@tanstack/svelte-query'
//
// import type { EdenQueryProxyConfig, EdenRequestOptions } from '../internal/options'
// import type { Join, Stringable } from '../utils/join'
// import type { EdenResolveOptions } from '../internal/config'

// export type TreatyQueryKey<T extends Stringable[] = []> = Join<T, '/'>
//
// export type TreatyData<TResponse extends Record<number, unknown>> = {
//   data: TResponse[200]
//   error: null
//   response: Response
//   status: number
//   headers: RequestInit['headers']
// }
//
// export type TreatyError<TResponse extends Record<number, unknown>> = {
//   data: null
//   error: Exclude<keyof TResponse, 200> extends never
//     ? {
//         status: unknown
//         value: unknown
//       }
//     : {
//         [Status in keyof TResponse]: {
//           status: Status
//           value: TResponse[Status]
//         }
//       }[Exclude<keyof TResponse, 200>]
//   response: Response
//   status: number
//   headers: RequestInit['headers']
// }
//

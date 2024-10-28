import type { RouteSchema } from 'elysia'

import type { EdenFetchError, MapError } from './errors'
import type { IsNever, IsUnknown, ReplaceGeneratorWithAsyncGenerator } from './utils/types'

type Files = File | FileList

type ReplaceBlobWithFiles<in out RecordType extends Record<string, unknown>> = {
  [K in keyof RecordType]: RecordType[K] extends Blob | Blob[] ? Files : RecordType[K]
} & {}

/**
 */
export type InferRouteOptions<
  TRoute extends RouteSchema = RouteSchema,
  /**
   * Helper for removing certain properties from the input, e.g. "cursor" for infinite queries...
   */
  TOmitInput extends string | number | symbol = never,
> = (IsNever<keyof TRoute['params']> extends true
  ? {
      params?: Record<never, string>
    }
  : {
      params: Omit<TRoute['params'], TOmitInput>
    }) &
  (IsNever<keyof TRoute['query']> extends true
    ? {
        query?: Record<never, string>
      }
    : {
        query: Omit<TRoute['query'], TOmitInput>
      }) &
  (undefined extends TRoute['headers']
    ? {
        headers?: Record<string, string>
      }
    : {
        headers: TRoute['headers']
      })

export type InferRouteBody<
  TRoute extends RouteSchema = RouteSchema,
  /**
   * Helper for removing certain properties from the input, e.g. "cursor" for infinite queries...
   */
  TOmitInput extends string | number | symbol = never,
> =
  IsUnknown<TRoute['body']> extends false
    ? undefined extends TRoute['body']
      ? ReplaceBlobWithFiles<Omit<TRoute['body'], TOmitInput>> | undefined
      : ReplaceBlobWithFiles<Omit<TRoute['body'], TOmitInput>>
    : unknown

/**
 * Only returns the output for a successful response.
 */
export type InferRouteOutput<TRoute extends RouteSchema = RouteSchema> =
  TRoute['response'] extends Record<number, unknown>
    ? ReplaceGeneratorWithAsyncGenerator<TRoute['response']>[200]
    : never

export type InferRouteError<T extends Record<string, any> = any> =
  MapError<T['response']> extends infer Errors
    ? IsNever<Errors> extends true
      ? EdenFetchError<number, string>
      : Errors
    : EdenFetchError<number, string>

/**
 * Untyped eden-treaty response. Will either return nullish data and defined error, or vice versa.
 * Look at concrete implementation of eden-treaty for strongly-typed variant.
 */
export type TreatyResponse<Res extends Record<number, unknown>> =
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

/**
 * Returns map of status codes to response types.
 */
export type InferRouteOutputAll<TRoute extends RouteSchema = RouteSchema> =
  TRoute['response'] extends Record<number, unknown>
    ? ReplaceGeneratorWithAsyncGenerator<TRoute['response']>
    : never

/**
 * Strongly typed route response.
 */
export type InferRouteResponse<TRoute extends RouteSchema = RouteSchema> = TreatyResponse<
  InferRouteOutputAll<TRoute>
>

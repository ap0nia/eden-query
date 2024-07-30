import type { RouteSchema } from 'elysia'

import type { IsNever, IsUnknown, ReplaceGeneratorWithAsyncGenerator } from './utils/types'

type Files = File | FileList

type ReplaceBlobWithFiles<in out RecordType extends Record<string, unknown>> = {
  [K in keyof RecordType]: RecordType[K] extends Blob | Blob[] ? Files : RecordType[K]
} & {}

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

export type InferRouteResponse<TRoute extends RouteSchema = RouteSchema> =
  TRoute['response'] extends Record<number, unknown>
    ? ReplaceGeneratorWithAsyncGenerator<TRoute['response']>[200]
    : never

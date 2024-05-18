import type { RouteSchema } from 'elysia'
import type { MaybeArray } from 'elysia/types'

import type { EdenFetchError, MapError } from '../internal/error'
import type { IsNever } from '../utils/is-never'
import type { IsUnknown } from '../utils/is-unknown'

type Files = File | FileList

type ReplaceBlobWithFiles<T> = {
  [K in keyof T]: T[K] extends MaybeArray<Blob> ? Files : T[K]
}

export type InferRouteInput<
  TRoute extends RouteSchema = any,
  _TMethod extends string = any,
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
      }) &
  (IsUnknown<TRoute['body']> extends false
    ? undefined extends TRoute['body']
      ? {
          body?: ReplaceBlobWithFiles<Omit<TRoute['body'], TOmitInput>>
        }
      : {
          body: ReplaceBlobWithFiles<Omit<TRoute['body'], TOmitInput>>
        }
    : {
        body?: unknown
      })

export type InferRouteOutput<T extends Record<string, any>> = Awaited<T['response'][200]>

export type InferRouteError<T extends Record<string, any>> = MapError<
  T['response']
> extends infer Errors
  ? IsNever<Errors> extends true
    ? EdenFetchError<number, string>
    : Errors
  : EdenFetchError<number, string>

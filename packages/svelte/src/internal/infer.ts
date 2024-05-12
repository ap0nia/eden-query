import type { EdenFetchError, MapError } from '../internal/error'
import type { IsNever } from '../utils/is-never'
import type { IsUnknown } from '../utils/is-unknown'
import type { EdenQueryRequestOptions } from './config'

type Files = File | FileList

type ReplaceBlobWithFiles<in out RecordType extends Record<string, unknown>> = {
  [K in keyof RecordType]: RecordType[K] extends Blob | Blob[] ? Files : RecordType[K]
} & {}

/**
 * Transforms a raw route definition into a more semantically accurate params object.
 */
export type InferRouteInput<
  TRoute extends Record<string, any> = any,
  _TMethod extends string = any,
  /**
   * Utility generic for filtering out certain properties from all input sources.
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
      }) & {
    eden?: EdenQueryRequestOptions
  }

export type InferRouteOutput<T extends Record<string, any>> = Omit<T, 'response'> & {
  data: Awaited<T['response'][200]>
}

export type InferRouteError<T extends Record<string, any>> = MapError<
  T['response']
> extends infer Errors
  ? IsNever<Errors> extends true
    ? EdenFetchError<number, string>
    : Errors
  : EdenFetchError<number, string>

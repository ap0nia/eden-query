import type { EdenFetchError, MapError } from '../internal/error'
import type { QueryType } from '../internal/query'
import type { IsNever } from '../utils/is-never'

export type InferRouteInput<
  T extends Record<string, any>,
  TInput = Pick<T, 'body' | 'params' | 'query'>,
  /**
   * Utility generic for filtering out certain properties from all input sources.
   */
  TOmit extends string | number | symbol = never,
> = {
  input: { [K in keyof TInput]: Omit<TInput[K], TOmit> }
  type?: QueryType
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

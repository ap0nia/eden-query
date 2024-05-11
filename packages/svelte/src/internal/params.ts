import type { IsNever } from '../utils/is-never'
import type { IsUnknown } from '../utils/is-unknown'
import type { EdenQueryProxyConfig } from './options'

type Files = File | FileList

type ReplaceBlobWithFiles<in out RecordType extends Record<string, unknown>> = {
  [K in keyof RecordType]: RecordType[K] extends Blob | Blob[] ? Files : RecordType[K]
} & {}

/**
 * Transforms a raw route definition into a more semantically accurate params object.
 */
export type EdenQueryParams<
  _TMethod extends string = any,
  TRoute extends Record<string, any> = any,
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
    eden?: EdenQueryProxyConfig
  }

/**
 */
export type EdenSubscribeParams<T extends Record<string, any>> =
  (undefined extends T['subscribe']['headers']
    ? { headers?: Record<string, unknown> }
    : {
        headers: T['subscribe']['headers']
      }) &
    (undefined extends T['subscribe']['query']
      ? { query?: Record<string, unknown> }
      : {
          query: T['subscribe']['query']
        })

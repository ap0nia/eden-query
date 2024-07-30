/* eslint-disable @typescript-eslint/no-namespace  */

import type { Elysia } from 'elysia'

import { EdenWS } from './ws'

type Not<T> = T extends true ? false : true

type IsNever<T> = [T] extends [never] ? true : false

type Prettify<T> = {
  [K in keyof T]: T[K]
} & {}

type Files = File | FileList

type ReplaceBlobWithFiles<in out RecordType extends Record<string, unknown>> = {
  [K in keyof RecordType]: RecordType[K] extends Blob | Blob[] ? Files : RecordType[K]
} & {}

type And<A extends boolean, B extends boolean> = A extends true
  ? B extends true
    ? true
    : false
  : false

type ReplaceGeneratorWithAsyncGenerator<T extends Record<string, unknown>> = {
  [K in keyof T]: T[K] extends Generator<infer A, infer B, infer C>
    ? And<Not<IsNever<A>>, void extends B ? true : false> extends true
      ? AsyncGenerator<A, B, C>
      : And<IsNever<A>, void extends B ? false : true> extends true
        ? B
        : AsyncGenerator<A, B, C> | B
    : T[K] extends AsyncGenerator<infer A, infer B, infer C>
      ? And<Not<IsNever<A>>, void extends B ? true : false> extends true
        ? AsyncGenerator<A, B, C>
        : And<IsNever<A>, void extends B ? false : true> extends true
          ? B
          : AsyncGenerator<A, B, C> | B
      : T[K]
} & {}

type MaybeArray<T> = T | T[]

type MaybePromise<T> = T | Promise<T>

export namespace Treaty {
  interface TreatyParam {
    fetch?: RequestInit
  }

  export type Create<App extends Elysia<any, any, any, any, any, any, any, any>> = App extends {
    _routes: infer Schema extends Record<string, any>
  }
    ? Prettify<Sign<Schema>>
    : 'Please install Elysia before using Eden'

  export type Sign<T extends Record<string, any>> = {
    [K in keyof T as K extends `:${string}` ? never : K]: K extends 'subscribe' // ? Websocket route
      ? (undefined extends T['subscribe']['headers']
          ? { headers?: Record<string, unknown> }
          : {
              headers: T['subscribe']['headers']
            }) &
          (undefined extends T['subscribe']['query']
            ? { query?: Record<string, unknown> }
            : {
                query: T['subscribe']['query']
              }) extends infer Param
        ? {} extends Param
          ? (options?: Param) => EdenWS<T['subscribe']>
          : (options?: Param) => EdenWS<T['subscribe']>
        : never
      : T[K] extends {
            body: infer Body
            headers: infer Headers
            params: any
            query: infer Query
            response: infer Response extends Record<number, unknown>
          }
        ? (undefined extends Headers
            ? { headers?: Record<string, unknown> }
            : { headers: Headers }) &
            (undefined extends Query
              ? { query?: Record<string, unknown> }
              : { query: Query }) extends infer Param
          ? {} extends Param
            ? undefined extends Body
              ? K extends 'get' | 'head'
                ? (
                    options?: Prettify<Param & TreatyParam>,
                  ) => Promise<TreatyResponse<ReplaceGeneratorWithAsyncGenerator<Response>>>
                : (
                    body?: Body,
                    options?: Prettify<Param & TreatyParam>,
                  ) => Promise<TreatyResponse<ReplaceGeneratorWithAsyncGenerator<Response>>>
              : (
                  body: Body extends Record<string, unknown> ? ReplaceBlobWithFiles<Body> : Body,
                  options?: Prettify<Param & TreatyParam>,
                ) => Promise<TreatyResponse<ReplaceGeneratorWithAsyncGenerator<Response>>>
            : K extends 'get' | 'head'
              ? (
                  options: Prettify<Param & TreatyParam>,
                ) => Promise<TreatyResponse<ReplaceGeneratorWithAsyncGenerator<Response>>>
              : (
                  body: Body extends Record<string, unknown> ? ReplaceBlobWithFiles<Body> : Body,
                  options: Prettify<Param & TreatyParam>,
                ) => Promise<TreatyResponse<ReplaceGeneratorWithAsyncGenerator<Response>>>
          : never
        : CreateParams<T[K]>
  }

  type CreateParams<T extends Record<string, any>> =
    Extract<keyof T, `:${string}`> extends infer Path extends string
      ? IsNever<Path> extends true
        ? Prettify<Sign<T>>
        : // ! DO NOT USE PRETTIFY ON THIS LINE, OTHERWISE FUNCTION CALLING WILL BE OMITTED
          (((params: {
            [param in Path extends `:${infer Param}`
              ? Param extends `${infer Param}?`
                ? Param
                : Param
              : never]: string | number
          }) => Prettify<Sign<T[Path]>> & CreateParams<T[Path]>) &
            Prettify<Sign<T>>) &
            (Path extends `:${string}?` ? CreateParams<T[Path]> : {})
      : never

  export interface Config {
    /**
     */
    transformer?: DataTransformerOptions

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

  export interface OnMessage<Data = unknown> extends MessageEvent {
    data: Data
    rawData: MessageEvent['data']
  }

  export type WSEvent<K extends keyof WebSocketEventMap, Data = unknown> = K extends 'message'
    ? OnMessage<Data>
    : WebSocketEventMap[K]
}

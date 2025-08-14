import type { MaybeArray, MaybePromise, Nullish } from '../utils/types'
import type { EdenFetchResult } from './dto'
import type { EdenClientError } from './error'
import type { FetchEsque, HeadersEsque } from './http'
import type { EdenRouteBody, EdenRouteInput } from './infer'
import type { TransformerConfig } from './transform'
import type { InternalElysia, TypeConfig } from './types'

/**
 * Configuration that is introspected by Eden types to dynamically apply features.
 * Primarily used to opt-in to strict type checking between the Eden client and Elysia.js server application.
 *
 * @internal
 */
export type EdenTypeConfig<T extends TypeConfig> = {
  /**
   * Either `true` to use the default configuration, or an object that satisfies the configuration.
   *
   * @default undefined
   */
  types?: T
}

/**
 * Accepted headers includes any object that resembles headers, or a promise that resolves to one.
 *
 * If a callback is provided, it will be called with the current params.
 * The callback can return header-esque objects to merge with the params, or mutate the params directly.
 *
 * An array of the previously mentioned types can be provided, and each will be handled accordingly.
 */
export type EdenRequestHeaders<
  TElysia extends InternalElysia = InternalElysia,
  TConfig extends TypeConfig = undefined,
> = HeadersEsque<[EdenRequestOptions<TElysia, TConfig>]>

/**
 */
export type EdenRequestTransformer<
  TElysia extends InternalElysia = InternalElysia,
  TConfig extends TypeConfig = undefined,
> = (
  path: string,
  options: RequestInit,
  params: EdenRequestOptions<TElysia, TConfig>,
) => MaybePromise<RequestInit | void>

/**
 */
export type EdenResponseTransformer<
  TElysia extends InternalElysia = InternalElysia,
  TConfig extends TypeConfig = undefined,
> = (response: Response, params: EdenRequestOptions<TElysia, TConfig>) => MaybePromise<unknown>

/**
 */
export type EdenFetchResultTransformer<
  TElysia extends InternalElysia = InternalElysia,
  TConfig extends TypeConfig = undefined,
> = (
  result: EdenFetchResult<any, EdenClientError>,
  params: EdenRequestOptions<TElysia, TConfig>,
) => MaybePromise<EdenFetchResult<any, EdenClientError> | Nullish>

/**
 * Configure the global behavior of the request resolver.
 */
export type EdenResolverTypeConfig<
  TElysia extends InternalElysia = InternalElysia,
  TConfig extends TypeConfig = undefined,
> = EdenTypeConfig<TConfig> & TransformerConfig<TElysia, TConfig>

/**
 * Configure the global behavior of the request resolver.
 */
export interface EdenResolverConfig<
  TElysia extends InternalElysia = InternalElysia,
  TConfig extends TypeConfig = undefined,
> {
  /**
   * Global query parameters for requests.
   */
  query?: Record<string, any> | URLSearchParams

  /**
   * Global fetch options.
   */
  fetch?: Omit<RequestInit, keyof EdenResolverTypeConfig>

  /**
   * Ponyfill for fetch.
   *
   * Feature is available in both tRPC and eden (official).
   *
   * @see https://github.com/trpc/trpc/blob/662da0bb0a2766125e3f7eced3576f05a850a069/packages/client/src/links/internals/httpUtils.ts#L29
   * @see https://github.com/elysiajs/eden/blob/7b4e3d90f9f69bc79ca108da4f514ee845c7d9d2/src/treaty2/index.ts#L164
   */
  fetcher?: FetchEsque | typeof fetch

  /**
   * Global headers, provide a function to compute headers based on the request.
   */
  headers?: EdenRequestHeaders<TElysia, TConfig>

  /**
   * Function(s) that can transform the request before it gets resolved.
   *
   * @default Eden provides a default that will apply transformers serializers with JSON or FormData bodies.
   */
  onRequest?: MaybeArray<EdenRequestTransformer<TElysia, TConfig>>

  /**
   * Function(s) that can transform the response before processing the result.
   * Each function will be called in sequence, stopping at the first one that returns data or an error.
   * The returned data or error will be used as the result.
   *
   * @default Eden provides a default that will attempt to parse the data from the {@link Response}.
   */
  onResponse?: MaybeArray<EdenResponseTransformer<TElysia, TConfig>>

  /**
   * Function(s) that can transform the result before the resolver resolves.
   *
   * @default Eden provides a default that will apply transformer deserializations to the response data.
   */
  onResult?: MaybeArray<EdenFetchResultTransformer<TElysia, TConfig>>

  /**
   * Whether to dynamically resolve the domain.
   *
   * @see https://github.com/elysiajs/eden/blob/7b4e3d90f9f69bc79ca108da4f514ee845c7d9d2/src/treaty2/index.ts#L477
   */
  keepDomain?: boolean

  /**
   * Either an origin or the Elysia.js application.
   */
  domain?: TElysia | string

  /**
   * Passed as second argument to new URL if applicable.
   *
   * Basically {@link EdenRequestInput.domain} but always a string representing the "origin" of the request.
   *
   * @example
   *
   * ```ts
   * const base = 'http://e.ly'
   * const path = '/posts/123'
   *
   * const url = new URL(path, base)
   * ```
   */
  base?: string

  /**
   * Default HTTP method for the request.
   *
   * Based on `methodOverride` from tRPC.
   *
   * @see https://github.com/trpc/trpc/blob/662da0bb0a2766125e3f7eced3576f05a850a069/packages/client/src/links/internals/httpUtils.ts#L35
   */
  method?: string
}

/**
 * Resolver input for a specific request.
 */
export interface EdenRequestInput {
  /**
   * Request input available for all requests. e.g. path parameters, query parameters, headers.
   *
   * These options are specifically nested under a sub-property to accommodate global options
   * set by {@link EdenResolverConfig}.
   *
   * For example, {@link EdenRequestInput.input.query} will have greater precedence than {@link EdenResolverConfig.query}
   * in the event of duplicate query parameters.
   */
  input?: EdenRouteInput

  /**
   * Request body for mutation requests, e.g. anything **not** "GET" like "POST," "PATCH," etc.
   */
  body?: EdenRouteBody

  /**
   * Request endpoint.
   */
  path?: string

  /**
   * Request HTTP method.
   */
  method?: string
}

/**
 * Options for configuring an individual request from Eden to an Elysia.js, REST server application.
 * Like an extended {@link RequestInit} for usage by Eden.
 */
export type EdenRequestOptions<
  TElysia extends InternalElysia = InternalElysia,
  TConfig extends TypeConfig = undefined,
> = EdenResolverTypeConfig<TElysia, TConfig> &
  EdenRequestInput &
  EdenResolverConfig<TElysia, TConfig>

/**
 * An internal version of request options with a simpler, more consistent interface.
 *
 * @internal
 */
export type InternalEdenRequestOptions<
  TElysia extends InternalElysia = InternalElysia,
  TConfig extends TypeConfig = undefined,
> = EdenResolverTypeConfig<TElysia, TConfig> &
  EdenRequestInput &
  Omit<EdenResolverConfig<TElysia, TConfig>, 'query' | 'headers'> & {
    headers?: Headers
    query?: URLSearchParams
    body_type?: string
  }

export type TypedEdenResolverConfig<
  TElysia extends InternalElysia = InternalElysia,
  TConfig extends TypeConfig = undefined,
> = EdenResolverTypeConfig<TElysia, TConfig> & EdenResolverConfig<TElysia, TConfig>

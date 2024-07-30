import type { InferRouteOptions } from '@elysiajs/eden'

/**
 * A well-defined query type used when creating query keys for a specific type of operation.
 */
export type EdenKnownQueryType = 'query' | 'infinite'

/**
 * Valid query types for creating query keys.
 */
export type EdenQueryType = EdenKnownQueryType | 'any'

/**
 * QueryKey used internally. Consists of a tuple with an array key and metadata.
 */
export type EdenQueryKey<
  TKey extends any[] = string[],
  TInput = unknown,
  TType extends EdenKnownQueryType = EdenKnownQueryType,
> = [key: TKey, metadata?: { input?: TInput; type?: TType }]

export type EdenQueryKeyOptions = InferRouteOptions & { body?: any }

export function getQueryKey(
  pathOrEndpoint: string | string[],
  options?: EdenQueryKeyOptions,
  type?: EdenQueryType,
): EdenQueryKey {
  const path = Array.isArray(pathOrEndpoint) ? pathOrEndpoint : pathOrEndpoint.split('/')
  const hasInput = options?.body != null || options?.params != null || options?.query != null
  const hasType = Boolean(type) && type !== 'any'

  if (!hasInput && !hasType) return [path]

  const input = { body: options?.body, params: options?.params, query: options?.query }
  return [path, { ...(hasInput && { input }), ...(hasType && { type }) }]
}

import type { EdenRequestOptions } from './options'

export type KnownQueryType = 'query' | 'infinite'

export type QueryType = KnownQueryType | 'any'

export type QueryKey = [key?: string[], metadata?: { input?: unknown; type?: KnownQueryType }]

export function getQueryKey(
  pathOrEndpoint: string | string[],
  options?: EdenRequestOptions,
  type?: QueryType,
): QueryKey {
  const path = Array.isArray(pathOrEndpoint) ? pathOrEndpoint : pathOrEndpoint.split('/')
  const hasInput = options?.body || options?.params || options?.query
  const hasType = Boolean(type) && type !== 'any'

  if (!hasInput && !hasType) return [path]

  const input = { body: options?.body, params: options?.params, query: options?.query }
  return [path, { ...(hasInput && { input }), ...(hasType && { type }) }]
}

export function getMutationKey(
  pathOrEndpoint: string | string[],
  options?: EdenRequestOptions,
): QueryKey {
  const path = Array.isArray(pathOrEndpoint) ? pathOrEndpoint : pathOrEndpoint.split('/')
  const hasInput = options?.body || options?.params || options?.query

  if (!hasInput) return [path]

  const input = { body: options?.body, params: options?.params, query: options?.query }
  return [path, { ...(hasInput && { input }) }]
}

import type { EdenRequestOptions } from './options'

export type KnownQueryType = 'query' | 'infinite'

export type QueryType = KnownQueryType | 'any'

export type QueryKey = [string?, { input?: unknown; type?: KnownQueryType }?]

export function getQueryKey(
  endpoint: string,
  options: EdenRequestOptions,
  type?: QueryType,
): QueryKey {
  const hasInput = options.body || options.params || options.query
  const hasType = Boolean(type) && type !== 'any'

  if (!hasInput && !hasType) return [endpoint]

  const input = { body: options.body, params: options.params, query: options.query }
  return [endpoint, { ...(hasInput && { input }), ...(hasType && { type }) }]
}

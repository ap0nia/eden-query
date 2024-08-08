import { type InferRouteOptions, isHttpMethod } from '@ap0nia/eden'

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
  TKey extends readonly any[] = readonly string[],
  TInput = unknown,
  TType extends EdenKnownQueryType = EdenKnownQueryType,
> = [key: TKey, metadata?: { input?: TInput; type?: TType }]

export type EdenQueryKeyOptions = InferRouteOptions & { body?: any }

export type EdenMutationKey = [readonly string[]]

function isArray<T>(value: T | T[] | readonly T[]): value is T[] | readonly T[] {
  return Array.isArray(value)
}

export function getQueryKey(
  pathOrEndpoint: string | string[] | readonly string[],
  options?: EdenQueryKeyOptions,
  type?: EdenQueryType,
): EdenQueryKey {
  const path = isArray(pathOrEndpoint) ? pathOrEndpoint : pathOrEndpoint.split('/')
  const hasInput = options?.body != null || options?.params != null || options?.query != null
  const hasType = Boolean(type) && type !== 'any'

  if (!hasInput && !hasType) return [path]

  const input = { body: options?.body, params: options?.params, query: options?.query }
  return [path, { ...(hasInput && { input }), ...(hasType && { type }) }]
}

export function createEdenQueryKey(paths: string[], args: any, type: EdenQueryType = 'any') {
  const pathsCopy: any[] = [...paths]

  /**
   * Only sometimes method, i.e. since invalidations can be partial and not include it.
   * @example 'get'
   */
  const method = pathsCopy[pathsCopy.length - 1]

  if (isHttpMethod(method)) {
    pathsCopy.pop()
  }

  const queryKey = getQueryKey(pathsCopy, args[0], type)

  return queryKey
}

export function getMutationKey(
  path: string | string[] | readonly string[],
  options?: EdenQueryKeyOptions,
): EdenMutationKey {
  return getQueryKey(path, options, 'any') as any
}

/**
 * Key in params or query that indicates GET routes that are eligible for infinite queries.
 */
export type InfiniteCursorKey = 'cursor'

/**
 * When providing request input to infinite queries, omit the "cursor" and "direction" properties
 * since these will be set by the integration.
 */
export type ReservedInfiniteQueryKeys = InfiniteCursorKey | 'direction'

/**
 * Given T, which is presumably a {@link RouteSchema}, merge the "params" and "query" types,
 * then extract the "cursor".
 */
export type ExtractCursorType<T> =
  T extends Record<string, any> ? (T['params'] & T['query'])['cursor'] : unknown

export type ExtractQueryCursor<T> = T extends Record<string, any> ? T['cursor'] : unknown

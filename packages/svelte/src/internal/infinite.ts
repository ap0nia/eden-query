import type { RouteSchema } from 'elysia'

export type GetRequestInput<T extends { params?: any; query?: any }> = T

export type InfiniteCursorKey = 'cursor'

export type ReservedInfiniteQueryKeys = InfiniteCursorKey | 'direction'

export type InfiniteInput<T extends RouteSchema> = InfiniteCursorKey extends keyof (T['params'] &
  T['query'])
  ? T
  : never

export type InfiniteRoutes<T> = {
  [K in keyof T as T[K] extends {
    get: GetRequestInput<InfiniteInput<infer _FetchOptions>>
  }
    ? K
    : never]: T[K]
}

export type N = InfiniteCursorKey extends keyof Record<never, string> | undefined ? true : false

export type GetRequestInput<T extends { params?: any; query?: any }> = T

export type InfiniteCursorKey = 'cursor'

export type ReservedInfiniteQueryKeys = InfiniteCursorKey | 'direction'

export type InfiniteInput<T extends Record<string, any>> =
  InfiniteCursorKey extends keyof (T['params'] & T['query']) ? T : never

export type InfiniteRoutes<T> = {
  [K in keyof T as T[K] extends {
    get: GetRequestInput<InfiniteInput<infer _FetchOptions>>
  }
    ? K
    : never]: T[K]
}

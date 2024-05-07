export type GetRequestInput<T extends { params?: any; query?: any }> = T

export type InfiniteCursorKey = 'cursor'

export type ReservedInfiniteQueryKeys = InfiniteCursorKey | 'direction'

export type InfiniteRoutes<T> = {
  [K in keyof T as T[K] extends {
    get: GetRequestInput<infer FetchOptions>
  }
    ? InfiniteCursorKey extends keyof (FetchOptions['params'] & FetchOptions['query'])
      ? K
      : never
    : never]: T[K]
}

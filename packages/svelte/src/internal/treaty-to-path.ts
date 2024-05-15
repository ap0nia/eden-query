import type { RouteSchema } from 'elysia'

import type { PARTIAL_ROUTE_PLACEHOLDER } from '../constants'
import type { Join } from '../utils/join'

export type TreatyToPath<T, Path extends any[] = []> = UnionToIntersect<
  T extends Record<string, any>
    ? {
        [K in keyof T]: T[K] extends RouteSchema
          ? {
              [path in Join<Path, '/', '/'>]: {
                [method in K]: T[K]
              }
            }
          : unknown extends T[K]
          ? {
              [path in Join<Path, '/', '/'>]: {
                [method in K]: T[K]
              }
            }
          : TreatyToPath<T[K], [...Path, K]> &
              // Part of a route, it can be used for invalidations.
              // e.g. A route /a/b/c can have an invalidation query for /a/b.
              Record<Join<Path, '/', '/'>, typeof PARTIAL_ROUTE_PLACEHOLDER>
      }[keyof T]
    : {}
>

type UnionToIntersect<U> = (U extends any ? (arg: U) => any : never) extends (arg: infer I) => void
  ? I
  : never

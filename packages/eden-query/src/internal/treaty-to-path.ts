export type TreatyToPath<T, Path extends string = ''> = UnionToIntersect<
  T extends Record<string, any>
    ? {
        [K in keyof T]: T[K] extends AnyTypedRoute
          ? {
              [path in Path]: {
                [method in K]: T[K]
              }
            }
          : unknown extends T[K]
          ? {
              [path in Path]: {
                [method in K]: T[K]
              }
            }
          : TreatyToPath<T[K], `${Path}/${K & string}`>
      }[keyof T]
    : {}
>

type AnyTypedRoute = {
  body?: unknown
  headers?: unknown
  query?: unknown
  params?: unknown
  response: Record<number, unknown>
}

type UnionToIntersect<U> = (U extends any ? (arg: U) => any : never) extends (arg: infer I) => void
  ? I
  : never

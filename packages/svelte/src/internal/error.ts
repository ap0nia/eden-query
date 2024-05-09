export class EdenFetchError<Status extends number = number, Value = unknown> extends Error {
  constructor(
    readonly status: Status,
    readonly value: Value,
  ) {
    super()
  }
}

export type MapError<T extends Record<number, unknown>> = [
  {
    [K in keyof T]-?: K extends ErrorRange ? K : never
  }[keyof T],
] extends [infer A extends number]
  ? {
      [K in A]: EdenFetchError<K, T[K]>
    }[A]
  : false

type ErrorRange = Range<300, 599>

type Range<F extends number, T extends number> = Exclude<Enumerate<T>, Enumerate<F>>

type Enumerate<N extends number, Acc extends number[] = []> = Acc['length'] extends N
  ? Acc[number]
  : Enumerate<N, [...Acc, Acc['length']]>

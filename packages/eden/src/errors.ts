import type { Range } from './utils/types'

export class EdenFetchError<Status extends number = number, Value = unknown> extends Error {
  constructor(
    public status: Status,
    public value: Value,
  ) {
    super(value + '')
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

export type ErrorRange = Range<300, 599>

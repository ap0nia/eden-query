import type { AnyElysia } from 'elysia'

import type { Range } from './utils/types'

export class EdenFetchError<Status extends number = number, Value = unknown> extends Error {
  constructor(
    public status: Status,
    public value: Value,
  ) {
    super(value + '')
  }
}

export class EdenFatalError extends Error {
  static throw() {
    return new EdenFatalError()
  }

  constructor() {
    super(
      'Something went wrong. Please submit an issue at https://github.com/ap0nia/eden-query/issues/new',
    )
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

/**
 * @todo
 */
export type EdenClientErrorLike<_T extends AnyElysia> = any

export const ERROR_SYMBOL = Symbol('TypeError')

export type TypeError<TMessage extends string> = TMessage & {
  _: typeof ERROR_SYMBOL
}

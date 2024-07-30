import type { AnyElysia, MaybeArray } from 'elysia'

import { createChain } from './internal/create-chain'
import { Observable } from './internal/observable'
import type { EdenLink, Operation } from './internal/operation'

function asArray<TType>(value: TType | TType[]) {
  return Array.isArray(value) ? value : [value]
}

export type SplitLinkOptions<T extends AnyElysia> = {
  /**
   */
  condition: (operation: Operation) => boolean

  /**
   * The link(s) to execute next if {@link SplitLinkOptions.condition} function returns `true`.
   */
  true: MaybeArray<EdenLink<T>>

  /**
   * The link(s) to execute next if {@link SplitLinkOptions.condition} function returns `false`.
   */
  false: MaybeArray<EdenLink<T>>
}

export function splitLink<T extends AnyElysia = AnyElysia>(
  options: SplitLinkOptions<T>,
): EdenLink<T> {
  return (runtime) => {
    const linksIfTrue = asArray(options.true).map((link) => link(runtime))
    const linksIfFalse = asArray(options.false).map((link) => link(runtime))

    const linksByCondition = { true: linksIfTrue, false: linksIfFalse }

    return ({ operation }) => {
      return new Observable((observer) => {
        const condition = options.condition(operation)

        const links = linksByCondition[`${condition}`]

        return createChain({ operation, links }).subscribe(observer)
      })
    }
  }
}

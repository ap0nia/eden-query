import type { AnyElysia } from 'elysia'

import { Observable } from './observable'
import {
  type Operation,
  OperationError,
  type OperationLink,
  type OperationResultObservable,
} from './operation'

export type ChainOptions<TElysia extends AnyElysia, TInput = unknown, TOutput = unknown> = {
  links: OperationLink<TElysia, TInput, TOutput>[]
  operation: Operation<TElysia>
}

export function createChain<TElysia extends AnyElysia, TInput = unknown, TOutput = unknown>(
  options: ChainOptions<TElysia, TInput, TOutput>,
): OperationResultObservable<TElysia, TOutput> {
  const observable = new Observable((observer) => {
    const execute = (index = 0, operation = options.operation) => {
      const next = options.links[index]

      if (next == null) {
        throw new OperationError('No more links to execute - did you forget to add an ending link?')
      }

      const subscription = next({
        operation,
        next: (nextOp) => {
          const nextObserver = execute(index + 1, nextOp)
          return nextObserver
        },
      })

      return subscription
    }

    const rootObservable = execute()

    const $rootObservable = rootObservable.subscribe(observer)

    return $rootObservable
  })

  return observable
}

import type { AnyElysia } from '../../types'
import { Observable } from './observable'
import type { Operation, OperationLink, OperationResultObservable } from './operation'

export function createChain<T extends AnyElysia, TInput = unknown, TOutput = unknown>(opts: {
  links: OperationLink<T, TInput, TOutput>[]
  operation: Operation<TInput>
}): OperationResultObservable<T, TOutput> {
  const observable = new Observable((observer) => {
    const execute = (index = 0, operation = opts.operation) => {
      const next = opts.links[index]

      if (next == null) {
        throw new Error('No more links to execute - did you forget to add an ending link?')
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

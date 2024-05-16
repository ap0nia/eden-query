import type { RouteSchema } from 'elysia'
import { createObservable } from './observable'
import type { Operation, OperationLink, OperationResultObservable } from './types'

export type ChainOptions<TRoute extends RouteSchema, TInput = unknown, TOutput = unknown> = {
  links: OperationLink<TRoute, TInput, TOutput>[]
  operation: Operation<TInput>
}

/**
 * @internal
 */
export function createChain<TRoute extends RouteSchema, TInput = unknown, TOutput = unknown>(
  options: ChainOptions<TRoute, TInput, TOutput>,
): OperationResultObservable<TRoute, TOutput> {
  const chain = createObservable((observer) => {
    const execute = (index = 0, operation = options.operation) => {
      const nextOperationLink = options.links[index]

      if (nextOperationLink == null) {
        throw new Error('No more links to execute - did you forget to add an ending link?')
      }

      const subscription = nextOperationLink({
        operation,
        next: (nextOperation) => {
          const nextObserver = execute(index + 1, nextOperation)
          return nextObserver
        },
      })
      return subscription
    }
    const observable = execute()
    return observable.subscribe(observer)
  })

  return chain
}

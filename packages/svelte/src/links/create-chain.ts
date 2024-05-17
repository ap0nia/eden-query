import { createObservable, type Observable } from './observable'
import type { OperationLink } from './operation'

export type ChainOptions<TInput = any, TOutput = any, TError = any> = {
  operation: TInput
  links: OperationLink<TInput, TOutput, TError>[]
}

/**
 * @internal
 */
export function createChain<TInput = any, TOutput = any, TError = any>(
  options: ChainOptions<TInput, TOutput, TError>,
): Observable<TOutput, TError> {
  const chain = createObservable((observer) => {
    const execute = (index = 0, operation = options.operation) => {
      const nextOperationLink = options.links[index]

      if (nextOperationLink == null) {
        throw new Error('No more links to execute - did you forget to add an ending link?')
      }

      const subscription = nextOperationLink({
        params: operation,
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

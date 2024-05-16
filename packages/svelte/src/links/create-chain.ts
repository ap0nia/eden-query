import type { RouteSchema } from 'elysia'

import type { InferRouteError, InferRouteOutput } from '../internal/infer'
import { type EdenRequestParams } from '../internal/resolve'
import {
  createObservable,
  type InferObservableValue,
  type Observable,
  promisifyObservable,
} from './observable'
import type { OperationLink } from './operation'
import { share } from './operators'

export type ChainOptions<TRoute extends RouteSchema = any> = {
  operation: EdenRequestParams
  links: OperationLink<TRoute>[]
}

/**
 * @internal
 */
export function createChain<
  TRoute extends RouteSchema,
  TOutput = InferRouteOutput<TRoute>,
  TError = InferRouteError<TRoute>,
>(options: ChainOptions<TRoute>): Observable<TOutput, TError> {
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

export async function createAndResolveChain(options: ChainOptions) {
  const requestChain = createChain(options).pipe(share())

  type TValue = InferObservableValue<typeof requestChain>

  const { promise, abortController } = promisifyObservable<TValue>(requestChain)

  const abort = () => abortController.abort()

  const abortablePromise = new Promise((resolve, reject) => {
    options.operation.config?.fetch?.signal?.addEventListener('abort', abort)
    promise.then(resolve).catch(reject)
  })

  return abortablePromise
}

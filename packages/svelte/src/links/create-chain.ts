import type { RouteSchema } from 'elysia'

import type { EdenQueryConfig } from '..'
import type { InferRouteError, InferRouteInput, InferRouteOutput } from '../internal/infer'
import {
  createObservable,
  type InferObservableValue,
  type Observable,
  promisifyObservable,
} from './observable'
import type { OperationLink } from './operation'
import { share } from './operators'

export type ChainOptions<TRoute extends RouteSchema> = {
  input: InferRouteInput<TRoute>
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
    const execute = (index = 0, input = options.input) => {
      const nextOperationLink = options.links[index]

      if (nextOperationLink == null) {
        throw new Error('No more links to execute - did you forget to add an ending link?')
      }

      const subscription = nextOperationLink({
        input,
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

export function request(options?: EdenQueryConfig) {
  const requestChain = createChain({ links: [], input: {} }).pipe(share())

  type TValue = InferObservableValue<typeof requestChain>

  const { promise, abortController } = promisifyObservable<TValue>(requestChain)

  const abort = () => abortController.abort()

  const abortablePromise = new Promise((resolve, reject) => {
    options?.fetch?.signal?.addEventListener('abort', abort)
    promise.then(resolve).catch(reject)
  })

  return abortablePromise
}

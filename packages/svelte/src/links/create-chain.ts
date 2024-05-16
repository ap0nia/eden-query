import type { RouteSchema } from 'elysia'

import type { EdenQueryConfig, EdenResolveConfig } from '../internal/config'
import type { InferRouteError, InferRouteOutput, RouteOutputSchema } from '../internal/infer'
import type { Noop } from '../utils/noop'
import {
  createObservable,
  type InferObservableValue,
  type Observable,
  promisifyObservable,
} from './observable'
import type { Operation, OperationLink } from './operation'
import { share } from './operators'

export type ChainOptions<TRoute extends RouteSchema> = {
  operation: Operation<TRoute>
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

export function request(options?: EdenQueryConfig) {
  const requestChain = createChain({ links: [], operation: {} as any }).pipe(share())

  type TValue = InferObservableValue<typeof requestChain>

  const { promise, abortController } = promisifyObservable<TValue>(requestChain)

  const abort = () => abortController.abort()

  const abortablePromise = new Promise((resolve, reject) => {
    options?.fetch?.signal?.addEventListener('abort', abort)
    promise.then(resolve).catch(reject)
  })

  return abortablePromise
}

/**
 * @internal
 */
export type PromiseAndCancel<T> = {
  promise: Promise<T>
  cancel: Noop
}

export type Requester = (opts: EdenResolveConfig) => PromiseAndCancel<RouteOutputSchema>

export function httpLinkFactory(factoryOpts: { requester: Requester }) {
  return <T extends RouteSchema>(
    options: HTTPLinkOptions<T['_def']['_config']['$types']>,
  ): OperationLink<T> => {
    return ({ operation: op }) => {
      const observable = createObservable((observer) => {
        const { path, input, method } = op

        const { promise, cancel } = factoryOpts.requester({
          ...resolvedOpts,
          method,
          path,
          input,
          headers: () => {
            if (!options.headers) {
              return {}
            }
            if (typeof options.headers === 'function') {
              return options.headers({
                op,
              })
            }
            return options.headers
          },
        })

        let meta: HTTPResult['meta'] | undefined = undefined

        promise
          .then((res) => {
            meta = res.meta
            const transformed = transformResult(res.json, resolvedOpts.transformer.output)

            if (!transformed.ok) {
              observer.error(
                TRPCClientError.from(transformed.error, {
                  meta,
                }),
              )
              return
            }

            observer.next({
              context: res.meta,
              result: transformed.result,
            })

            observer.complete()
          })
          .catch((cause) => {
            observer.error(TRPCClientError.from(cause, { meta }))
          })

        return () => {
          cancel()
        }
      })

      return observable
    }
  }
}

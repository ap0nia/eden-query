import type { RouteSchema } from 'elysia'

import type { EdenQueryConfig } from '../internal/config'
import type { InferRouteError, InferRouteOutput } from '../internal/infer'
import {
  type EdenRequestParams,
  type EdenRequestResolver,
  resolveEdenRequest,
} from '../internal/resolve'
import type { Noop } from '../utils/noop'
import {
  createObservable,
  type InferObservableValue,
  type Observable,
  promisifyObservable,
} from './observable'
import type { OperationLink } from './operation'
import { share } from './operators'

export type ChainOptions<TRoute extends RouteSchema> = {
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

export type HttpLinkFactoryConfig = {
  resolver: EdenRequestResolver
}

/**
 * TODO: link options.
 */
export type HttpLinkOptions = {}

export function httpLinkFactory(config: HttpLinkFactoryConfig) {
  return <T extends RouteSchema>(_options?: HttpLinkOptions): OperationLink<T> => {
    return ({ operation: op }) => {
      const observable = createObservable((observer) => {
        const abortController = op.config?.fetch?.signal != null ? new AbortController() : null

        // Create and forward a new AbortController that can be aborted from this parent scope.
        if (op.config?.fetch?.signal != null) {
          op.config.fetch.signal = abortController?.signal
        }

        const promise = config.resolver(op)

        const cancel = () => {
          abortController?.abort()
        }

        promise
          .then((result) => {
            observer.next(result)
            observer.complete()
          })
          .catch((cause) => {
            observer.error(cause)
          })

        return () => {
          cancel()
        }
      })

      return observable
    }
  }
}

export const httpLink = httpLinkFactory({ resolver: resolveEdenRequest })

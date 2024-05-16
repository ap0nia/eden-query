import {
  type EdenRequestParams,
  type EdenRequestResolver,
  resolveEdenRequest,
} from '../internal/resolve'
import { createObservable } from './observable'
import type { OperationLink } from './operation'

/**
 * TODO: link options.
 */
export type HttpLinkOptions = {}

export type HttpLinkFactoryConfig = {
  resolver: EdenRequestResolver
}

export function httpLinkFactory(config: HttpLinkFactoryConfig) {
  return (_options?: HttpLinkOptions): OperationLink<EdenRequestParams> => {
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

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
    return ({ operation }) => {
      const observable = createObservable((observer) => {
        config
          .resolver(operation)
          .then((result) => {
            observer.next(result)
            observer.complete()
          })
          .catch((cause) => {
            observer.error(cause)
          })
      })
      return observable
    }
  }
}

export const httpLink = httpLinkFactory({ resolver: resolveEdenRequest })

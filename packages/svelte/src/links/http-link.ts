import type { EdenRequestOptions } from '../internal/request'
import type { AnyElysia } from '../types'
import { getAbortController, type HTTPLinkBaseOptions } from './internals/http'
import { Observable, type Observer } from './internals/observable'
import type { EdenLink, Operation, OperationLink } from './internals/operation'
import { type Requester, universalRequester } from './internals/universal-requester'

export type HTTPLinkFactoryOptions = {
  requester: Requester
}

export type HTTPLinkOptions = HTTPLinkBaseOptions & EdenRequestOptions

export type HTTPLinkFactory = <T extends AnyElysia>(options?: HTTPLinkOptions) => EdenLink<T>

export function httpLinkFactory(factoryOptions: HTTPLinkFactoryOptions): HTTPLinkFactory {
  const factory: HTTPLinkFactory = (linkOptions = {}) => {
    const link: EdenLink = (_runtime) => {
      const resolveOperation = (operation: Operation, observer: Observer<any, any>) => {
        const { fetch, domain, AbortController, methodOverride, ...defaultParams } = linkOptions

        const { id, context, type, params } = operation

        const options = {
          fetch,
          AbortController: getAbortController(AbortController),
          methodOverride,
          id,
          context,
          type,
          params: { ...defaultParams, domain, ...params },
        }

        const { promise, cancel } = factoryOptions.requester(options)

        promise
          .then((result) => {
            observer.next(result)
            observer.complete()
          })
          .catch((cause) => {
            observer.error(cause)
          })

        return cancel
      }

      const operationLink: OperationLink = ({ operation }) => {
        const observable = new Observable(resolveOperation.bind(undefined, operation))
        return observable
      }

      return operationLink
    }

    return link
  }

  return factory
}

/**
 * @link https://trpc.io/docs/v11/client/links/httpLink
 */
export const httpLink = httpLinkFactory({ requester: universalRequester })

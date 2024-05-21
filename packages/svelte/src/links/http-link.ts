import type { EdenRequestOptions } from '../internal/request'
import type { AnyElysia } from '../types'
import { getAbortController, type HTTPLinkBaseOptions } from './internals/http'
import { Observable } from './internals/observable'
import type { EdenLink, OperationLink } from './internals/operation'
import { type Requester, universalRequester } from './internals/universal-requester'

export type HTTPLinkFactoryOptions = {
  requester: Requester
}

export type HTTPLinkOptions = HTTPLinkBaseOptions & EdenRequestOptions

export type HTTPLinkFactory = <T extends AnyElysia>(options?: HTTPLinkOptions) => EdenLink<T>

export function httpLinkFactory(factoryOptions: HTTPLinkFactoryOptions): HTTPLinkFactory {
  const factory: HTTPLinkFactory = (linkOptions = {}) => {
    const link: EdenLink = (_runtime) => {
      const operationLink: OperationLink = ({ operation }) => {
        const observable = new Observable((subscriber) => {
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
              subscriber.next(result)
              subscriber.complete()
            })
            .catch((cause) => {
              subscriber.error(cause)
            })

          return () => {
            cancel()
          }
        })

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

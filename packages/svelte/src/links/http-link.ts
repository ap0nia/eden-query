import type { AnyElysia } from '../types'
import { getAbortController } from './internals/http'
import { Observable } from './internals/observable'
import type { EdenLink, OperationLink } from './internals/operation'
import {
  type Requester,
  type RequesterOptions,
  universalRequester,
} from './internals/universal-requester'

export type HTTPLinkFactoryOptions = {
  requester: Requester
}

export type HTTPLinkFactory = <T extends AnyElysia>(options: RequesterOptions) => EdenLink<T>

export function httpLinkFactory(factoryOptions: HTTPLinkFactoryOptions): HTTPLinkFactory {
  const factory: HTTPLinkFactory = (requesterOptions) => {
    const link: EdenLink = (_runtime) => {
      const operationLink: OperationLink = ({ operation }) => {
        const observable = new Observable((subscriber) => {
          const { fetch, AbortController, methodOverride, ...defaultParams } = requesterOptions

          const { id, context, type, ...operationParams } = operation

          const options = {
            fetch,
            AbortController: getAbortController(AbortController),
            methodOverride,
            id,
            context,
            type,
            params: { ...defaultParams, ...operationParams },
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

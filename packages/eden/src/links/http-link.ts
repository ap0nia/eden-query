import type { AnyElysia } from 'elysia'

import type { EdenQueryStoreKey } from '../constraints'
import { getAbortController, type HTTPHeaders, type HTTPLinkBaseOptions } from '../http'
import type { EdenRequestOptions } from '../request'
import type { NonEmptyArray } from '../utils/types'
import { Observable, type Observer } from './internal/observable'
import type { EdenLink, Operation, OperationLink } from './internal/operation'
import type { DataTransformerOptions } from './internal/transformer'
import { type Requester, universalRequester } from './internal/universal-requester'

export type HTTPLinkFactoryOptions = {
  requester: Requester
}

export type HTTPLinkOptions<
  T extends AnyElysia = AnyElysia,
  /**
   * @todo Maybe check if T['store'][EdenQueryStoreKey] matches a certain interface?
   */
  TTransformer = T['store'][typeof EdenQueryStoreKey]['transformer'],
> = HTTPLinkBaseOptions &
  Omit<EdenRequestOptions<T>, 'headers' | 'transformer'> & {
    /**
     * @todo: Merge this headers type into {@link EdenRequestOptions}
     */
    headers?:
      | HTTPHeaders
      | ((operations: NonEmptyArray<Operation>) => HTTPHeaders | Promise<HTTPHeaders>)
  } & (TTransformer extends DataTransformerOptions
    ? { transformer: TTransformer }
    : {
        transformer?: DataTransformerOptions
      })

export type HTTPLinkFactory = <T extends AnyElysia>(options?: HTTPLinkOptions<T>) => EdenLink<T>

export function httpLinkFactory(factoryOptions: HTTPLinkFactoryOptions): HTTPLinkFactory {
  const factory: HTTPLinkFactory = (linkOptions = {} as any) => {
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
 * @see https://trpc.io/docs/v11/client/links/httpLink
 */
export const safeHttpLink = httpLinkFactory({ requester: universalRequester })

/**
 * @see https://trpc.io/docs/v11/client/links/httpLink
 */
export function httpLink<T extends AnyElysia>(options?: HTTPLinkOptions<T, true>): EdenLink<T> {
  return safeHttpLink(options as any)
}

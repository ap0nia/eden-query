import type { MaybeArray } from 'elysia/types'

import { BATCH_ENDPOINT } from '../constants'
import type { HTTPHeaders } from '../internal/http'
import { resolveEdenRequest } from '../internal/resolve'
import { arrayToDict } from '../utils/array-to-dict'
import type { NonEmptyArray } from '../utils/non-empty-array'
import { notNull } from '../utils/null'
import { batchedDataLoader, type BatchLoader } from './batch-data-loader'
import { httpLinkFactory } from './http-link'
import type { Operation, OperationType } from './internals/operation'
import { type Requester } from './internals/universal-requester'
import type { CombinedDataTransformer } from './transformer'

export type HTTPBatchRequesterOptions = {
  endpoint?: string
  maxURLLength?: number
  headers?:
    | HTTPHeaders
    | ((operations: NonEmptyArray<Operation>) => HTTPHeaders | Promise<HTTPHeaders>)
  transformer?: CombinedDataTransformer
}

export type GetInputParams = {
  url?: string
  path: string
  type: OperationType
  transformer?: CombinedDataTransformer
  input: MaybeArray<unknown>
  methodOverride?: 'POST'
}

export function getInput(params: GetInputParams) {
  return Array.isArray(params.input)
    ? arrayToDict(params.input.map((input) => params.transformer?.input.serialize(input)))
    : params.transformer?.input.serialize(params.input)
}

export function getUrl(params: GetInputParams) {
  let url = params.url + '/' + params.path

  const queryParts: string[] = []

  if (Array.isArray(params.input)) {
    queryParts.push('batch=1')
  }

  if (params.type === 'query') {
    const input = getInput(params)

    if (input !== undefined && params.methodOverride !== 'POST') {
      queryParts.push(`input=${encodeURIComponent(JSON.stringify(input))}`)
    }
  }

  if (queryParts.length) {
    url += '?' + queryParts.join('&')
  }

  return url
}

function createBatchRequester(options?: HTTPBatchRequesterOptions): Requester {
  const resolvedFactoryOptions = { maxURLLength: Infinity, ...options }

  const createBatchLoader = (type: OperationType): BatchLoader<Operation> => {
    return {
      validate: (batchOps) => {
        // Escape hatch for quick calcs.
        if (resolvedFactoryOptions.maxURLLength === Infinity) return true

        const path = batchOps.map((operation) => operation.params.endpoint).join(',')
        const input = batchOps.map((operation) => operation.params.input?.query)

        const url = getUrl({
          ...resolvedFactoryOptions,
          type,
          path,
          input,
        })

        return url.length <= resolvedFactoryOptions.maxURLLength
      },
      fetch: (batchOps) => {
        const body = new FormData()

        const endpoint = resolvedFactoryOptions?.endpoint ?? BATCH_ENDPOINT

        batchOps.forEach((operation, index) => {
          const path = operation.params.endpoint ?? ''

          if (operation.params.method != null) {
            body.append(`${index}.method`, operation.params.method)
          }

          body.append(`${index}.path`, path)
        })

        const signals = batchOps.map((b) => b.params.signal).filter(notNull)

        const abortController = signals.length ? new AbortController() : null

        signals.forEach((signal) => {
          signal.addEventListener('abort', () => {
            abortController?.abort()
          })
        })

        const cancel = () => {
          abortController?.abort()
        }

        const headers =
          resolvedFactoryOptions.headers == null
            ? {}
            : typeof resolvedFactoryOptions.headers === 'function'
            ? resolvedFactoryOptions.headers(batchOps as NonEmptyArray<Operation>)
            : resolvedFactoryOptions.headers

        const promise = resolveEdenRequest({
          signal: signals.length ? abortController?.signal : undefined,
          endpoint,
          method: 'POST',
          input: { body },
          headers,
        }).then((result) => {
          return 'data' in result ? result.data : []
        })

        return { promise, cancel }
      },
    }
  }

  const queryBatchLoader = createBatchLoader('query')
  const mutationBatchLoader = createBatchLoader('mutation')
  const subscriptionBatchLoader = createBatchLoader('subscription')

  const query = batchedDataLoader(queryBatchLoader)
  const mutation = batchedDataLoader(mutationBatchLoader)
  const subscription = batchedDataLoader(subscriptionBatchLoader)

  const loaders = { query, subscription, mutation }

  return (options) => loaders[options.type].load(options)
}

/**
 * @link https://trpc.io/docs/v11/client/links/httpLink
 */
export const httpBatchLink = (options?: HTTPBatchRequesterOptions) => {
  const batchRequester = createBatchRequester(options)
  return httpLinkFactory({ requester: batchRequester })()
}

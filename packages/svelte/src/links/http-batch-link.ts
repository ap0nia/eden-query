import type { MaybeArray } from 'elysia/types'

import { BATCH_ENDPOINT } from '../constants'
import type { HTTPHeaders } from '../internal/http'
import { type ResolvedEdenRequest, resolveEdenRequest } from '../internal/resolve'
import { arrayToDict } from '../utils/array-to-dict'
import type { NonEmptyArray } from '../utils/non-empty-array'
import { notNull } from '../utils/null'
import { batchedDataLoader, type BatchLoader } from './batch-data-loader'
import { httpLinkFactory } from './http-link'
import type { Operation, OperationType } from './internals/operation'
import {
  type Requester,
  type RequesterOptions,
  universalRequester,
} from './internals/universal-requester'
import { type DataTransformerOptions, getDataTransformer } from './transformer'

export type HTTPBatchRequesterOptions = {
  endpoint?: string
  maxURLLength?: number
  headers?:
    | HTTPHeaders
    | ((operations: NonEmptyArray<Operation>) => HTTPHeaders | Promise<HTTPHeaders>)
  transformer?: DataTransformerOptions
}

export type GetInputParams = {
  url?: string
  path: string
  type: OperationType
  transformer?: DataTransformerOptions
  input: MaybeArray<unknown>
  methodOverride?: 'POST'
}

export function getInput(params: GetInputParams) {
  const transformer = getDataTransformer(params.transformer)

  return Array.isArray(params.input)
    ? arrayToDict(params.input.map((input) => transformer?.input.serialize(input)))
    : transformer?.input.serialize(params.input)
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
        if (batchOps.length === 1) {
          const [firstOperation] = batchOps

          if (firstOperation != null) {
            const requesterOptions: RequesterOptions = {
              transformer: options?.transformer,
              ...firstOperation,
            }

            const singleResult = universalRequester(requesterOptions)

            const promise = singleResult.promise.then((result) => [result])

            return { promise, cancel: singleResult.cancel }
          }
        }

        const body = new FormData()

        const query: Record<string, any> = {}

        const endpoint = resolvedFactoryOptions?.endpoint ?? BATCH_ENDPOINT

        batchOps.forEach((operation, index) => {
          let path = operation.params.endpoint ?? ''

          if (operation.params.method != null) {
            body.append(`${index}.method`, operation.params.method)
          }

          if (operation.params.input?.params != null) {
            Object.entries(operation.params.input?.params).forEach(([key, value]) => {
              path = path.replace(`:${key}`, value as string)
            })
          }

          if (operation.params.input?.query != null) {
            Object.entries(operation.params.input.query).forEach(([key, value]) => {
              if (value != null) {
                query[`${index}.${key}`] = value
              }
            })
          }

          if (operation.params.input?.body != null) {
            const transformer = getDataTransformer(
              options?.transformer ?? operation.params.transformer,
            )

            if (operation.params.input.body instanceof FormData) {
              body.append(`${index}.body_type`, 'formdata')

              operation.params.input.body.forEach((value, key) => {
                const resolvedValue =
                  transformer != null ? transformer.input.serialize(value) : value

                body.set(`${index}.body.${key}`, resolvedValue)
              })
            } else {
              body.append(`${index}.body_type`, 'json')

              const resolvedBody =
                transformer != null
                  ? transformer.input.serialize(operation.params.input.body)
                  : operation.params.input.body

              body.set(`${index}.body`, JSON.stringify(resolvedBody))
            }
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
          transformer: options?.transformer,
          signal: abortController?.signal,
          endpoint,
          method: 'POST',
          input: { body, query },
          headers,
        }).then((result) => {
          if (!('data' in result) || !Array.isArray(result.data)) {
            return []
          }

          const batchedResults: ResolvedEdenRequest[] = result.data

          const transformer = getDataTransformer(options?.transformer)

          if (transformer == null) {
            return result.data
          }

          const transformedResponses = batchedResults.map((nestedResult: ResolvedEdenRequest) => {
            if (nestedResult.data != null) {
              nestedResult.data = transformer.output.deserialize(nestedResult.data)
            }
            return nestedResult
          })

          return transformedResponses
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

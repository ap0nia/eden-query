import type { AnyElysia, MaybeArray } from 'elysia'

import { BATCH_ENDPOINT } from '../constants'
import type { HTTPHeaders } from '../http'
import { type EdenResponse } from '../request'
import { type EdenRequestParams, resolveEdenRequest } from '../resolve'
import { arrayToDict } from '../utils/array-to-dict'
import { notNull } from '../utils/null'
import type { NonEmptyArray } from '../utils/types'
import { httpLinkFactory } from './http-link'
import { batchedDataLoader, type BatchLoader } from './internal/batched-data-loader'
import type { Operation, OperationType } from './internal/operation'
import { type DataTransformerOptions, getDataTransformer } from './internal/transformer'
import {
  type Requester,
  type RequesterOptions,
  universalRequester,
} from './internal/universal-requester'

export type HTTPBatchRequesterOptions = {
  endpoint?: string
  maxURLLength?: number
  headers?:
    | HTTPHeaders
    | ((operations: NonEmptyArray<Operation>) => HTTPHeaders | Promise<HTTPHeaders>)
  transformer?: DataTransformerOptions
  method?: BatchMethod
  domain?: AnyElysia | string
}

export type GetInputParams = {
  url?: string
  path: string
  type: OperationType
  transformer?: DataTransformerOptions
  input: MaybeArray<unknown>
  method?: BatchMethod
}

export type BatchMethod = 'GET' | 'POST'

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

    if (input !== undefined && params.method !== 'POST') {
      queryParts.push(`input=${encodeURIComponent(JSON.stringify(input))}`)
    }
  }

  if (queryParts.length) {
    url += '?' + queryParts.join('&')
  }

  return url
}

/**
 * If using POST request to batch, most of the request data will be encoded in the FormData body.
 *
 * It will look like this:
 *
 * {
 *   // POST request to /api/a with a JSON body of { value: 0 }
 *
 *   '0.path': '/api/a',
 *   '0.method': 'POST',
 *   '0.body_type': 'JSON',
 *   '0.body': '{ value: 0 }'
 *
 *   // GET request to /api/b?name=elysia, i.e. query of name=elysia
 *
 *   '1.path': '/api/b',
 *   '1.method': 'GET',
 *   '1.query.name': 'elysia'
 * }
 */
export function generatePostBatchParams(
  operations: Operation[],
  options?: HTTPBatchRequesterOptions,
) {
  const body = new FormData()

  const headers = new Headers()

  operations.forEach((operation, index) => {
    let operationPath = operation.params.path ?? ''

    if (operation.params.method != null) {
      body.append(`${index}.method`, operation.params.method)
    }

    /**
     * TODO: should `{index}.params.${key}` be encoded in the body too, or only the finalized path?
     *
     * For now, it's encoded only in the finalized path to simplify the data storage.
     */
    if (operation.params.options?.params != null) {
      Object.entries(operation.params.options?.params).forEach(([key, value]) => {
        operationPath = operationPath.replace(`:${key}`, value as string)
      })
    }

    /**
     * TODO: should `{index}.query.${key}` be encoded in the finalized path?
     *
     * For now, it's encoded in the body to save URL space...
     */
    if (operation.params.options?.query != null) {
      Object.entries(operation.params.options.query).forEach(([key, value]) => {
        body.append(`${index}.query.${key}`, value as any)
      })
    }

    if (operation.params?.body != null) {
      const transformer = getDataTransformer(options?.transformer ?? operation.params.transformer)

      if (operation.params.body instanceof FormData) {
        body.append(`${index}.body_type`, 'formdata')

        operation.params.body.forEach((value, key) => {
          const resolvedValue = transformer != null ? transformer.input.serialize(value) : value

          body.set(`${index}.body.${key}`, resolvedValue)
        })
      } else {
        body.append(`${index}.body_type`, 'json')

        const resolvedBody =
          transformer != null
            ? transformer.input.serialize(operation.params.body)
            : operation.params.body

        body.set(`${index}.body`, JSON.stringify(resolvedBody))
      }
    }

    body.append(`${index}.path`, operationPath)
  })

  return { body, query: {}, headers }
}

/**
 * If using GET request to batch, the request data will be encoded in query parameters.
 * This is only possible if all requests are GET requests.
 *
 * The query will look like this
 *
 * // GET request to /api/b?name=elysia, i.e. query of name=elysia
 *
 * batch=1&0.path=/api/b&0.method=GET&0.query.name=elysia
 */
export function generateGetBatchParams(operations: Operation[]) {
  const query: Record<string, any> = {}

  const headers = new Headers()

  operations.forEach((operation, index) => {
    let operationPath = operation.params.path ?? ''

    if (operation.params.method != null) {
      query[`${index}.method`] = operation.params.method
    }

    if (operation.params.options?.params != null) {
      Object.entries(operation.params.options?.params).forEach(([key, value]) => {
        operationPath = operationPath.replace(`:${key}`, value as string)
      })
    }

    if (operation.params.options?.query != null) {
      Object.entries(operation.params.options.query).forEach(([key, value]) => {
        if (value != null) {
          query[`${index}.query.${key}`] = operation.params.method
        }
      })
    }

    // Don't handle body for GET requests.
    // if (operation.params?.body != null) { }
  })

  return { body: null, query, headers }
}

const generateBatchParams = {
  GET: generateGetBatchParams,
  POST: generatePostBatchParams,
}

function createBatchRequester(options?: HTTPBatchRequesterOptions): Requester {
  const resolvedFactoryOptions = { maxURLLength: Infinity, ...options }

  const domain = resolvedFactoryOptions.domain

  const transformer = resolvedFactoryOptions.transformer

  const createBatchLoader = (type: OperationType): BatchLoader<Operation> => {
    return {
      validate: (batchOps) => {
        // Escape hatch for quick calculations.
        if (resolvedFactoryOptions.maxURLLength === Infinity) return true

        const path = batchOps.map((operation) => operation.params.path).join(',')
        const input = batchOps.map((operation) => operation.params.options?.query)

        const url = getUrl({ ...resolvedFactoryOptions, type, path, input })

        return url.length <= resolvedFactoryOptions.maxURLLength
      },
      fetch: (batchOps) => {
        if (batchOps.length === 1) {
          const [firstOperation] = batchOps

          if (firstOperation != null) {
            const requesterOptions: RequesterOptions = {
              transformer,
              ...firstOperation,
            }

            if (domain != null) {
              requesterOptions.params = { ...requesterOptions.params, domain }
            }

            const singleResult = universalRequester(requesterOptions)

            const promise = singleResult.promise.then((result) => [result])

            return { promise, cancel: singleResult.cancel }
          }
        }

        const signals = batchOps.map((b) => b.params.fetch?.signal).filter(notNull)

        const abortController = signals.length ? new AbortController() : null

        signals.forEach((signal) => {
          signal.addEventListener('abort', () => {
            abortController?.abort()
          })
        })

        const cancel = () => {
          abortController?.abort()
        }

        const path = resolvedFactoryOptions?.endpoint ?? BATCH_ENDPOINT

        const defaultBatchMethod: BatchMethod = resolvedFactoryOptions.method ?? 'POST'

        /**
         * If any operations are a POST requests, can't batch with GET request...
         */
        const method: BatchMethod =
          defaultBatchMethod === 'GET'
            ? batchOps.find((op) => op.params.method === 'POST')
              ? 'POST'
              : 'GET'
            : 'POST'

        const batchParams = generateBatchParams[method](batchOps, resolvedFactoryOptions)

        const defaultHeaders =
          resolvedFactoryOptions.headers == null
            ? undefined
            : typeof resolvedFactoryOptions.headers === 'function'
              ? resolvedFactoryOptions.headers(batchOps as NonEmptyArray<Operation>)
              : resolvedFactoryOptions.headers

        const { body, query } = batchParams

        const headers = { ...defaultHeaders, ...batchParams.headers }

        const resolvedParams: EdenRequestParams<any, true> = {
          domain,
          transformer,
          path,
          method,
          options: { query },
          body,
          headers,
          raw: true,
        }

        if (signals.length) {
          resolvedParams.fetch ??= {}
          resolvedParams.fetch.signal = abortController?.signal
        }

        const promise = resolveEdenRequest(resolvedParams).then((result) => {
          /**
           * result.data should be an array of JSON data from each request in the batch.
           */
          if (!('data' in result) || !Array.isArray(result.data)) {
            return []
          }

          const batchedData: EdenResponse<true>[] = result.data

          const transformer = getDataTransformer(options?.transformer)

          /**
           * The batch plugin also encodes its data into a JSON.
           *
           * @example
           * If the data from a batched request is [3, 'OK', false],
           * the batch plugin should return a JSON like
           * [
           *   { data: 3, error: null, status: 200, statusText: 'OK' },
           *   { data: 'OK', error: null, status: 200, statusText: 'OK' }
           *   { data: false, error: null, status: 200, statusText: 'OK' }
           * ]
           */
          const transformedResponses = batchedData.map((batchedResult, index) => {
            // The raw data from each request has not be de-serialized yet.
            // De-serialize it so every entry is the finalized result.
            if (transformer != null && batchedResult.data != null) {
              batchedResult.data = transformer.output.deserialize(batchedResult.data)
            }

            const operation = batchOps[index]

            // If this specific operation wanted the raw information, append the required properties.
            if (operation?.params.raw) {
              // Recreate custom headers object.
              const headers = new Headers()

              /**
               * If the header value has a numeric prefix, only assign it if it matches the operation index,
               * otherwise, assign it.
               *
               * The batch plugin will add a numeric prefix to organize the headers.
               *
               * @example
               * '0.set-cookie': 'abc' should be a header only for request 0.
               * 'set-cookie': should be a header for all the batched requests.
               */
              result.headers.forEach((value, key) => {
                const [prefix, name] = key.split('.')

                if (Number(prefix) === index && name != null) {
                  headers.set(name, value)
                } else {
                  headers.set(key, value)
                }
              })

              /**
               * TODO: how to guarantee that this value is the correct body?
               */
              const body =
                transformer != null
                  ? transformer.output.serialize(batchedResult.data)
                  : JSON.stringify(batchedResult.data)

              /**
               * Create a new response using the re-serialized body.
               */
              const response = new Response(body, {
                status: batchedResult.status,
                statusText: batchedResult.statusText,
                headers,
              })

              batchedResult.headers = headers
              batchedResult.response = response
            }

            return batchedResult
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

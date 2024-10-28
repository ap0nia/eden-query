import type { AnyElysia } from 'elysia'

import { BATCH_ENDPOINT } from '../constants'
import type { EdenQueryStoreKey } from '../constraints'
import type { TypeError } from '../errors'
import type { HTTPHeaders } from '../http'
import type { BatchPluginOptions } from '../plugins'
import { type EdenRequestOptions, type EdenResponse } from '../request'
import { type EdenRequestParams, resolveEdenRequest } from '../resolve'
import { notNull } from '../utils/null'
import type { NonEmptyArray } from '../utils/types'
import { httpLinkFactory } from './http-link'
import { batchedDataLoader, type BatchLoader } from './internal/batched-data-loader'
import type { EdenLink, Operation, OperationType } from './internal/operation'
import { type DataTransformerOptions, getDataTransformer } from './internal/transformer'
import {
  type Requester,
  type RequesterOptions,
  universalRequester,
} from './internal/universal-requester'

/**
 * @remarks Do not derive this from HTTPLinkOptions, because it breaks the types for some reason...
 *
 * @template TTransformer
 * @todo Maybe check if T['store'][EdenQueryStoreKey] matches a certain interface?
 */
export type HttpBatchLinkOptions<
  T extends AnyElysia = AnyElysia,
  TTransformer = T['store'][typeof EdenQueryStoreKey]['transformer'],
> = Omit<EdenRequestOptions, 'headers' | 'method' | 'transformer'> & {
  /**
   * Path for the batch endpoint.
   *
   * @example /batch
   */
  endpoint?: string

  /**
   * Configure the maximum URL length if making batch requests with GET.
   */
  maxURLLength?: number

  /**
   * @todo: Merge this headers type into {@link EdenRequestOptions}
   */
  headers?:
    | HTTPHeaders
    | ((operations: NonEmptyArray<Operation>) => HTTPHeaders | Promise<HTTPHeaders>)

  method?: BatchMethod
} & (TTransformer extends false
    ? {
        transformer?: DataTransformerOptions
      }
    : TTransformer extends DataTransformerOptions
      ? { transformer: TTransformer }
      : {
          transformer?: DataTransformerOptions
        })

export type BatchMethod = 'GET' | 'POST'

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
export function generateGetBatchRequestInformation(operations: Operation[]) {
  const query: Record<string, any> = {}

  const headers = new Headers()

  operations.forEach((operation, index) => {
    let operationPath = operation.params.path ?? ''

    // Handle path params.
    for (const key in operation.params.options?.params) {
      const placeholder = `:${key}`
      const param = operation.params.options.params[key as never]
      if (param != null) {
        operationPath = operationPath.replace(placeholder, param)
      }
    }

    query[`${index}.path`] = operationPath

    if (operation.params.method != null) {
      query[`${index}.method`] = operation.params.method
    }

    for (const key in operation.params.options?.query) {
      const value = operation.params.options.query[key as never]
      if (value != null) {
        query[`${index}.query.${key}`] = value
      }
    }

    // Handle headers.

    /**
     * These headers may be set at the root of the client as defaults.
     */
    const defaultHeaders =
      typeof operation.params.headers === 'function'
        ? operation.params.headers(operationPath, operation.params.fetch)
        : operation.params.headers

    /**
     * These headers are set on this specific request.
     */
    const requestHeaders = operation.params.options?.headers

    const resolvedHeaders = { ...defaultHeaders, ...requestHeaders }

    for (const key in resolvedHeaders) {
      const header = resolvedHeaders[key as never]
      if (header != null) {
        headers.append(key, header)
      }
    }
  })

  return { body: null, query, headers }
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
export function generatePostBatchRequestInformation(
  operations: Operation[],
  options?: HttpBatchLinkOptions,
) {
  const body = new FormData()

  const headers = new Headers()

  operations.forEach((operation, index) => {
    let operationPath = operation.params.path ?? ''

    // Specify method of the request.
    if (operation.params.method != null) {
      body.append(`${index}.method`, operation.params.method)
    }

    // Handle path parameters.
    for (const key in operation.params.options?.params) {
      const placeholder = `:${key}`
      const param = operation.params.options.params[key as never]
      if (param != null) {
        operationPath = operationPath.replace(placeholder, param)
      }
    }

    // Specify the path of the request.
    body.append(`${index}.path`, operationPath)

    // Handle query parameters.
    for (const key in operation.params.options?.query) {
      const value = operation.params.options.query[key as never]

      if (value != null) {
        body.append(`${index}.query.${key}`, value)
      }
    }

    // Handle headers.

    /**
     * These headers may be set at the root of the client as defaults.
     */
    const defaultHeaders =
      typeof operation.params.headers === 'function'
        ? operation.params.headers(operationPath, operation.params.fetch)
        : operation.params.headers

    /**
     * These headers are set on this specific request.
     */
    const requestHeaders = operation.params.options?.headers

    const resolvedHeaders = { ...defaultHeaders, ...requestHeaders }

    for (const key in resolvedHeaders) {
      const header = resolvedHeaders[key as never]
      if (header != null) {
        headers.append(key, header)
      }
    }

    // Handle body.

    if (operation.params?.body == null) return

    const rawTransformer = options?.transformer ?? operation.params.transformer

    const transformer = getDataTransformer(rawTransformer)

    if (operation.params.body instanceof FormData) {
      body.append(`${index}.body_type`, 'formdata')

      operation.params.body.forEach((value, key) => {
        const serialized = transformer.input.serialize(value)

        // FormData is special and can handle additional data types, like Files.
        // So we will not JSON.stringify the serialized result.
        body.set(`${index}.body.${key}`, serialized)
      })
    } else {
      body.append(`${index}.body_type`, 'json')

      const serialized = transformer.input.serialize(operation.params.body)
      const stringified = JSON.stringify(serialized)

      body.set(`${index}.body`, stringified)
    }
  })

  return { body, query: {}, headers }
}

const generateBatchRequestInformation = {
  GET: generateGetBatchRequestInformation,
  POST: generatePostBatchRequestInformation,
}

function createBatchRequester(options: HttpBatchLinkOptions = {}): Requester {
  const resolvedFactoryOptions = { maxURLLength: Infinity, ...options }

  const { endpoint, maxURLLength, headers, transformer, method, domain, ...requestOptions } =
    resolvedFactoryOptions

  const createBatchLoader = (_type: OperationType): BatchLoader<Operation> => {
    return {
      validate: (batchOps) => {
        // Escape hatch for quick calculations.
        if (maxURLLength === Infinity) return true

        const requestInformation = generateGetBatchRequestInformation(batchOps)

        const searchParams = new URLSearchParams(requestInformation.query)

        const path = endpoint ?? BATCH_ENDPOINT

        const url = `${path}${searchParams.size ? '?' : ''}${searchParams}`

        return url.length <= maxURLLength
      },
      fetch: (batchOps) => {
        if (batchOps.length === 1) {
          const [firstOperation] = batchOps

          if (firstOperation != null) {
            const requesterOptions: RequesterOptions = {
              transformer,
              ...requestOptions,
              ...firstOperation,
            }

            // Forward domain.
            if (domain != null) {
              requesterOptions.params = { ...requesterOptions.params, domain }
            }

            const singleResult = universalRequester(requesterOptions)

            // Batched-data-loader expects an array of results,
            // which will each be resolved to the corresponding promise.
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

        const defaultBatchMethod: BatchMethod = method ?? 'POST'

        /**
         * If any operations are a POST requests, can't batch with GET request...
         */
        const resolvedMethod: BatchMethod =
          defaultBatchMethod === 'GET'
            ? batchOps.find((op) => op.params.method === 'POST')
              ? 'POST'
              : 'GET'
            : 'POST'

        const batchInformationGenerator = generateBatchRequestInformation[resolvedMethod]

        const information = batchInformationGenerator(batchOps, resolvedFactoryOptions)

        const path = endpoint ?? BATCH_ENDPOINT

        const defaultHeaders =
          headers == null
            ? undefined
            : typeof headers === 'function'
              ? headers(batchOps as NonEmptyArray<Operation>)
              : headers

        // Force to await headers.
        const awaitDefaultHeaders = async () => await defaultHeaders

        const promise = awaitDefaultHeaders().then(async (defaultHeaders) => {
          const { body, query } = information

          for (const key in defaultHeaders) {
            const header = defaultHeaders[key as never]
            if (header != null) {
              information.headers.append(key, header)
            }
          }

          const resolvedParams: EdenRequestParams<any, true> = {
            domain,
            transformer,
            path,
            method: resolvedMethod,
            options: { query },
            body,
            headers: information.headers,
            ...requestOptions,
            raw: true,
          }

          if (signals.length) {
            resolvedParams.fetch ??= {}
            resolvedParams.fetch.signal = abortController?.signal
          }

          const result = await resolveEdenRequest(resolvedParams)

          /**
           * result.data should be an array of JSON data from each request in the batch.
           */
          if (!('data' in result) || !Array.isArray(result.data)) {
            return []
          }

          const batchedData: EdenResponse<true>[] = result.data

          const resolvedTransformer = getDataTransformer(transformer)

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
            if (resolvedTransformer != null && batchedResult.data != null) {
              batchedResult.data = resolvedTransformer.output.deserialize(batchedResult.data)
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
                resolvedTransformer != null
                  ? resolvedTransformer.output.serialize(batchedResult.data)
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
 * @see https://trpc.io/docs/v11/client/links/httpLink
 */
export const safeHttpBatchLink = <T extends AnyElysia>(
  options?: HttpBatchLinkOptions<T>,
): T['store'][typeof EdenQueryStoreKey]['batch'] extends true | BatchPluginOptions
  ? EdenLink<T>
  : TypeError<'Batch plugin not detected on Elysia.js app instance'> => {
  const batchRequester = createBatchRequester(options)
  return httpLinkFactory({ requester: batchRequester })() as any
}

/**
 * @see https://trpc.io/docs/v11/client/links/httpLink
 */
export function httpBatchLink<T extends AnyElysia>(
  options?: HttpBatchLinkOptions<T, false>,
): EdenLink<T> {
  return safeHttpBatchLink(options as any) as any
}

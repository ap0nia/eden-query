import type { RouteOutputSchema } from '../internal/infer'
import { type EdenRequestParams, type EdenResponse, resolveEdenRequest } from '../internal/resolve'
import type { Noop } from '../utils/noop'
import type { HttpLinkOptions } from '.'
import { batchedDataLoader, type BatchLoader } from './batched-data-loader'
import { createObservable } from './observable'
import type { OperationLink } from './operation'

export type HttpBatchLinkFactoryConfig = {
  requester: BatchRequesterFactory
  validator: BatchValidatorFactory
}

export type BatchRequesterFactory = (options?: BatchRequesterOptions) => BatchRequester

export type BatchValidatorFactory = (options?: BatchRequesterOptions) => BatchValidator

export type BatchRequesterOptions = {
  method?: string
}

export type BatchValidator = (keys: EdenRequestParams[]) => boolean

export type BatchRequester = (
  batchParams: EdenRequestParams[],
  unitResolver: (index: number, value: RouteOutputSchema) => void,
) => {
  promise: Promise<EdenResponse[]>
  cancel: Noop
}

export interface HttpBatchLinkOptions extends HttpLinkOptions {
  maxURLLength?: number
  method?: string
}

const postBatchRequesterFactory: BatchRequesterFactory = (_options) => {
  return (batchParams) => {
    const body = new FormData()

    /**
     * TODO: resolve root params for the batch request properly.
     */
    const resolvedRootParams = { ...batchParams[0] }

    batchParams.forEach((params, index) => {
      const path = '/' + (params.endpoint ?? params.paths?.join('/') ?? '')
      body.append(`${index}.method`, params.method ?? 'GET')
      body.append(`${index}.path`, path)
    })

    const signal = resolvedRootParams?.signal ?? resolvedRootParams?.config?.fetch?.signal

    const abortController = signal != null ? new AbortController() : null

    signal?.addEventListener('abort', () => {
      abortController?.abort()
    })

    const cancel = () => {
      abortController?.abort()
    }

    if (resolvedRootParams?.signal != null) {
      resolvedRootParams.signal = signal
    } else if (resolvedRootParams.config?.fetch?.signal != null) {
      resolvedRootParams.config.fetch.signal = signal
    }

    const promise = resolveEdenRequest({
      ...resolvedRootParams,
      endpoint: 'api/batch',
      method: 'POST',
      bodyOrOptions: body,
    }).then((result) => {
      return 'data' in result ? result.data : []
    })

    return { promise, cancel }
  }
}

const batchRequesterFactory: BatchRequesterFactory = (options) => {
  const method = options?.method ?? 'POST'

  switch (method.toUpperCase()) {
    /**
     * TODO: support GET batch requester.
     */
    case 'GET':
    case 'POST':
    default: {
      return postBatchRequesterFactory(options)
    }
  }
}

const batchValidatorFactory: BatchValidatorFactory = (options) => {
  return (_batchParams) => {
    const method = options?.method ?? 'POST'

    switch (method.toUpperCase()) {
      /**
       * TODO: support GET batch validator.
       */
      case 'GET':
      case 'POST':
      default: {
        return true
      }
    }
  }
}

/**
 */
export function httpBatchLinkFactory(config: HttpBatchLinkFactoryConfig) {
  return (options?: HttpBatchLinkOptions): OperationLink<EdenRequestParams> => {
    const batchLoader: BatchLoader<EdenRequestParams> = {
      validate: config.validator(options),
      fetch: config.requester(options),
    }

    const batchResolver = batchedDataLoader(batchLoader)

    return ({ params }) => {
      return createObservable((observer) => {
        const { promise, cancel } = batchResolver(params)

        promise
          .then((result) => {
            observer.next(result)
            observer.complete()
          })
          .catch((err) => {
            observer.error(err)
          })

        return () => {
          cancel()
        }
      })
    }
  }
}

export const httpBatchLink = httpBatchLinkFactory({
  requester: batchRequesterFactory,
  validator: batchValidatorFactory,
})

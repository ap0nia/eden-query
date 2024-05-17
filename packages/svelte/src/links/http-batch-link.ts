import type { RouteOutputSchema } from '../internal/infer'
import { type EdenRequestParams, type EdenResponse, resolveEdenRequest } from '../internal/resolve'
import type { Noop } from '../utils/noop'
import type { HttpLinkOptions } from '.'
import { createObservable } from './observable'
import type { OperationLink } from './operation'

export type BatchRequesterOptions = {}

export type BatchRequestResolver = (
  batchParams: EdenRequestParams[],
  unitResolver: (index: number, value: RouteOutputSchema) => void,
) => {
  promise: Promise<EdenResponse[]>
  cancel: Noop
}

/**
 * @internal
 */
export type BatchRequester = (options?: BatchRequesterOptions) => BatchRequestResolver

export interface HttpBatchLinkOptions extends HttpLinkOptions {
  maxURLLength?: number
}

export type BatchItem<TKey, TValue> = {
  aborted: boolean
  key: TKey
  resolve: ((value: TValue) => void) | null
  reject: ((error: Error) => void) | null
  batch: Batch<TKey, TValue> | null
}

export type Batch<TKey, TValue> = {
  items: BatchItem<TKey, TValue>[]
  cancel: Noop
}

export type BatchLoader<TKey, TValue> = {
  validate: (keys: TKey[]) => boolean
  fetch: (
    keys: TKey[],
    unitResolver: (index: number, value: NonNullable<TValue>) => void,
  ) => {
    promise: Promise<TValue[]>
    cancel: Noop
  }
}

/**
 * A function that should never be called unless we messed something up.
 */
function throwFatalError() {
  throw new Error(
    'Something went wrong. Please submit an issue at https://github.com/trpc/trpc/issues/new',
  )
}

/**
 * {@see https://github.com/graphql/dataloader}
 *
 * Less configuration, no caching, and allows you to cancel requests.
 * When cancelling a single fetch the whole batch will be cancelled only when _all_ items are cancelled.
 */
export function batchedDataLoader<TKey, TValue>(loader: BatchLoader<TKey, TValue>) {
  let pendingItems: BatchItem<TKey, TValue>[] | null = null
  let dispatchTimer: ReturnType<typeof setTimeout> | null = null

  const destroyTimerAndPendingItems = () => {
    clearTimeout(dispatchTimer as any)
    dispatchTimer = null
    pendingItems = null
  }

  /**
   * Iterate through the items and split them into groups based on the `batchLoader`'s validate function
   */
  const groupItems = (items: BatchItem<TKey, TValue>[]) => {
    const groupedItems: BatchItem<TKey, TValue>[][] = [[]]

    let index = 0
    let item: BatchItem<TKey, TValue> | undefined

    while ((item = items[index])) {
      const lastGroup = groupedItems[groupedItems.length - 1]

      if (lastGroup == null) break

      // Item was aborted before it was dispatched.
      if (item.aborted) {
        item.reject?.(new Error('Aborted'))
        index++
        continue
      }

      const isValid = loader.validate(lastGroup.concat(item).map((item) => item.key))

      // Add consecutive, valid items that have not been aborted to the end of the queue.
      if (isValid) {
        lastGroup.push(item)
        index++
        continue
      }

      if (lastGroup.length === 0) {
        item.reject?.(new Error('Input is too big for a single dispatch'))
        index++
        continue
      }

      // Create new group, next iteration will try to add the item to that.
      groupedItems.push([])
    }

    return groupedItems
  }

  const dispatch = () => {
    const groupedItems = groupItems(pendingItems ?? [])

    destroyTimerAndPendingItems()

    // Create batches for each group of items
    for (const items of groupedItems) {
      if (items.length === 0) continue

      const batch: Batch<TKey, TValue> = { items, cancel: throwFatalError }

      for (const item of items) {
        item.batch = batch
      }

      const unitResolver = (index: number, value: NonNullable<TValue>) => {
        const item = batch.items[index]

        if (item == null) return

        item.resolve?.(value)
        item.batch = null
        item.reject = null
        item.resolve = null
      }

      const { promise, cancel } = loader.fetch(
        batch.items.map((item) => item.key),
        unitResolver,
      )

      batch.cancel = cancel

      promise
        .then((result) => {
          for (let i = 0; i < result.length; i++) {
            const value = result[i]
            if (value != null) {
              unitResolver(i, value)
            }
          }

          for (const item of batch.items) {
            item.reject?.(new Error('Missing result'))
            item.batch = null
          }
        })
        .catch((cause) => {
          for (const item of batch.items) {
            item.reject?.(cause)
            item.batch = null
          }
        })
    }
  }

  const load = (key: TKey) => {
    const item: BatchItem<TKey, TValue> = {
      aborted: false,
      key,
      batch: null,
      resolve: throwFatalError,
      reject: throwFatalError,
    }

    const promise = new Promise<TValue>((resolve, reject) => {
      item.reject = reject
      item.resolve = resolve
      pendingItems ??= []
      pendingItems.push(item)
    })

    dispatchTimer ??= setTimeout(dispatch)

    const cancel = () => {
      item.aborted = true

      // All items in the batch have been cancelled
      if (item.batch?.items.every((item) => item.aborted)) {
        item.batch.cancel()
        item.batch = null
      }
    }

    return { promise, cancel }
  }

  return { load }
}

const batchRequester: BatchRequester = (_options) => {
  return (batchParams) => {
    const body = new FormData()

    const firstParams = batchParams[0]

    batchParams.forEach((params, index) => {
      const path = '/' + (params.endpoint ?? params.paths?.join('/') ?? '')
      body.append(`${index}.method`, params.method ?? 'GET')
      body.append(`${index}.path`, path)
    })

    const signal = firstParams?.signal ?? firstParams?.config?.fetch?.signal

    const abortController = signal != null ? new AbortController() : null

    signal?.addEventListener('abort', () => {
      abortController?.abort()
    })

    const cancel = () => {
      abortController?.abort()
    }

    const promise = resolveEdenRequest({
      ...firstParams,
      endpoint: 'api/batch',
      method: 'POST',
      bodyOrOptions: body,
    }).then((result) => {
      return 'data' in result ? result.data : []
    })

    return { promise, cancel }
  }
}

/**
 * @internal
 */
export function createHTTPBatchLink(requester: BatchRequester) {
  return (options?: HttpBatchLinkOptions): OperationLink<EdenRequestParams> => {
    const maxURLLength = options?.maxURLLength ?? Infinity

    const batchLoader = (): BatchLoader<any, any> => {
      const validate = (batchParams: EdenRequestParams[]): boolean => {
        if (maxURLLength === Infinity) return true

        const paths = batchParams.map((params) => {
          const rawEndpoint =
            params.paths?.filter((p) => p !== 'index').join('/') ?? params.endpoint ?? ''
          return rawEndpoint
        })

        const inputs = batchParams.map((op) => op.bodyOrOptions)

        const url = paths.join(',') + inputs.join(',')
        return url.length <= maxURLLength
      }

      const fetch = requester()

      return { validate, fetch }
    }

    const loader = batchedDataLoader(batchLoader())

    return ({ operation }) => {
      return createObservable((observer) => {
        const { promise, cancel } = loader.load(operation)

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

export const httpBatchLink = createHTTPBatchLink(batchRequester)

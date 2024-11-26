import { EdenFatalError } from '../../errors'
import type { Noop } from '../../utils/noop'

export type Batch<TKey, TValue> = {
  items: BatchItem<TKey, TValue>[]
  cancel: Noop
}

export type BatchItem<TKey, TValue> = {
  aborted: boolean
  key: TKey
  resolve: ((value: TValue) => void) | null
  reject: ((error: Error) => void) | null
  batch: Batch<TKey, TValue> | null
}

export type BatchLoader<TKey = any, TValue = any> = {
  /**
   * Determines whether the current operation fits in the same batch.
   */
  validate: (keys: TKey[]) => boolean

  /**
   * Queues a request.
   */
  fetch: BatchFetcher<TKey, TValue>
}

export type BatchFetcher<TKey, TValue> = (
  keys: TKey[],
  unitResolver: (index: number, value: NonNullable<TValue>) => void,
) => {
  promise: Promise<TValue[]>
  cancel: Noop
}

export class BatchError extends Error {
  constructor(message?: string) {
    super(message)
  }
}

/**
 * {@see https://github.com/graphql/dataloader}
 *
 * Less configuration, no caching, and allows you to cancel requests.
 * When cancelling a single fetch the whole batch will be cancelled only when _all_ items are cancelled.
 */
export function batchedDataLoader<TKey, TValue>(loader: BatchLoader<TKey, TValue>) {
  let pendingItems: BatchItem<TKey, TValue>[] = []
  let dispatchTimer: ReturnType<typeof setTimeout> | null = null

  const destroyTimerAndPendingItems = () => {
    clearTimeout(dispatchTimer as any)
    dispatchTimer = null
    pendingItems = []
  }

  /**
   * Iterate through the items and split them into groups based on the `batchLoader`'s validate function
   */
  const groupItems = (items: BatchItem<TKey, TValue>[]) => {
    const groupedItems: BatchItem<TKey, TValue>[][] = [[]]

    let index = 0
    let item: BatchItem<TKey, TValue> | undefined
    let lastGroup: BatchItem<TKey, TValue>[] | undefined

    for (
      ;
      index < items.length && (lastGroup = groupedItems.at(-1)) && (item = items[index]);
      ++index
    ) {
      // Item was aborted before it was dispatched.
      if (item.aborted) {
        item.reject?.(new BatchError('Aborted'))
        continue
      }

      // Create a new group to test whether the resulting group would be valid;
      // do not mutate the original group reference if it is not.
      const lastGroupWithNewItem = [...lastGroup, item]

      const keys = lastGroupWithNewItem.map((item) => item.key)

      const isValid = loader.validate(keys)

      // Add consecutive, valid items that have not been aborted to the end of the queue.
      if (isValid) {
        lastGroup.push(item)
        continue
      }

      // Failed to add any items to an existing group.
      if (lastGroup.length === 0) {
        item.reject?.(new BatchError('Invalid item failed to be added to batch.'))
        continue
      }

      const newGroup = [item]
      const newKeys = [item.key]

      const isNewGroupValid = loader.validate(newKeys)

      if (isNewGroupValid) {
        groupedItems.push(newGroup)
      } else {
        item.reject?.(new BatchError('Invalid item failed to be added to batch.'))
        groupedItems.push([])
      }
    }

    return groupedItems
  }

  const createUnitResolver =
    (batch: Batch<TKey, TValue>) => (index: number, value: NonNullable<TValue>) => {
      const item = batch.items[index]
      if (item == undefined) return
      item.resolve?.(value)
      item.batch = null
      item.reject = null
      item.resolve = null
    }

  const dispatch = () => {
    const groupedItems = groupItems(pendingItems)

    destroyTimerAndPendingItems()

    // Create batches for each group of items
    for (const items of groupedItems) {
      if (items.length === 0) continue

      const batch: Batch<TKey, TValue> = { items, cancel: EdenFatalError.throw }

      for (const item of items) {
        item.batch = batch
      }

      const unitResolver = createUnitResolver(batch)

      const { promise, cancel } = loader.fetch(
        batch.items.map((item) => item.key),
        unitResolver,
      )

      batch.cancel = cancel

      promise
        .then((result) => {
          for (const [index, value] of result.entries()) {
            if (value != undefined) {
              unitResolver(index, value)
            }
          }

          for (const item of batch.items) {
            item.reject?.(new Error('Missing result'))
            item.batch = null
          }
        })
        .catch((error) => {
          for (const item of batch.items) {
            item.reject?.(error)
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
      resolve: EdenFatalError.throw,
      reject: EdenFatalError.throw,
    }

    const promise = new Promise<TValue>((resolve, reject) => {
      item.reject = reject
      item.resolve = resolve
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

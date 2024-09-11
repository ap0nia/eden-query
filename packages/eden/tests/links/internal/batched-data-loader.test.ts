import { describe, expect, test, vi } from 'vitest'

import { batchedDataLoader, BatchError } from '../../../src/links/internal/batched-data-loader'

describe('batchedDataLoader', () => {
  test('returns all data to the original promise and calls helper methods expected number times', async () => {
    const validate = vi.fn(() => true)

    const fetch = vi.fn((keys: string[]) => {
      const promise = new Promise<any[]>((resolve) => resolve(keys))

      return {
        promise,
        cancel: () => {},
      }
    })

    const dataloader = batchedDataLoader({ validate, fetch })

    const values = ['Elysia', 'Aponia', 'Eden']

    const results = values.map(dataloader.load)

    for (let i = 0; i < values.length; ++i) {
      await expect(results[i]?.promise).resolves.toBe(values[i])
    }

    // Each load request needs to be validated.
    expect(validate).toHaveBeenCalledTimes(values.length)

    // The requests were batched, so only one fetch was made.
    expect(fetch).toHaveBeenCalledTimes(1)
  })

  test('returns all data with Promise.all', async () => {
    const validate = vi.fn(() => true)

    const fetch = vi.fn((keys: string[]) => {
      const promise = new Promise<any[]>((resolve) => resolve(keys))

      return {
        promise,
        cancel: () => {},
      }
    })

    const dataloader = batchedDataLoader({ validate, fetch })

    const values = ['Elysia', 'Aponia', 'Eden']

    const results = Promise.all(values.map(dataloader.load).map((result) => result.promise))

    await expect(results).resolves.toStrictEqual(values)

    expect(fetch).toHaveBeenCalledTimes(1)
  })

  test('rejects all promises if abort is called', async () => {
    vi.useFakeTimers()

    const validate = vi.fn(() => true)

    const fetch = vi.fn((keys: string[]) => {
      const abortController = new AbortController()

      const promise = new Promise<any[]>((resolve, reject) => {
        const timeout = setTimeout(() => {
          resolve(keys)
        }, 100)

        abortController.signal.addEventListener('abort', () => {
          clearTimeout(timeout)
          reject()
        })
      })

      return {
        promise,
        cancel: () => abortController.abort(),
      }
    })

    const dataloader = batchedDataLoader({ validate, fetch })

    const values = ['Elysia', 'Aponia', 'Eden']

    const results = values.map(dataloader.load)

    const settled = Promise.allSettled(results.map((result) => result.promise))

    // During this time, all the items will be grouped and in-progress, but not resolved.
    vi.advanceTimersByTime(50)

    // Cancel the items before they resolve.
    results.forEach((result) => result.cancel())

    // At this point, the items would have resolved normally, but they were rejected.
    vi.advanceTimersByTime(50)

    await expect(settled).resolves.toEqual(
      values.map(() => expect.objectContaining({ status: 'rejected' })),
    )

    // The grouped items were cancelled in-progress, so there was still one request.
    expect(fetch).toHaveBeenCalledTimes(1)

    vi.useRealTimers()
  })

  test('rejects if validate returns false for input', async () => {
    const validate = vi.fn(() => false)

    const fetch = vi.fn((keys: string[]) => {
      const abortController = new AbortController()

      const promise = new Promise<any[]>((resolve, reject) => {
        const timeout = setTimeout(() => {
          resolve(keys)
        })

        abortController.signal.addEventListener('abort', () => {
          clearTimeout(timeout)
          reject()
        })
      })

      return {
        promise,
        cancel: () => abortController.abort(),
      }
    })

    const dataloader = batchedDataLoader({ validate, fetch })

    const values = ['Elysia', 'Aponia', 'Eden']

    const results = values.map(dataloader.load)

    const settled = Promise.allSettled(results.map((result) => result.promise))

    await expect(settled).resolves.toEqual(
      values.map(() =>
        expect.objectContaining({
          status: 'rejected',
          reason: expect.any(BatchError),
        }),
      ),
    )

    // All the promises were invalid, so they did not get added to any groups or resolved.
    expect(fetch).not.toHaveBeenCalled()
  })

  test('tries to make a new group and fails if validate returns false after a group exists and false for the new group', async () => {
    let i = 0

    const numToFulfill = 1

    const validate = vi.fn(() => {
      return ++i === numToFulfill
    })

    const fetch = vi.fn((keys: string[]) => {
      const abortController = new AbortController()

      const promise = new Promise<any[]>((resolve, reject) => {
        const timeout = setTimeout(() => {
          resolve(keys)
        }, 100)

        abortController.signal.addEventListener('abort', () => {
          clearTimeout(timeout)
          reject()
        })
      })

      return {
        promise,
        cancel: () => abortController.abort(),
      }
    })

    const dataloader = batchedDataLoader({ validate, fetch })

    const values = ['Elysia', 'Aponia', 'Eden']

    const results = values.map(dataloader.load)

    const settled = Promise.allSettled(results.map((result) => result.promise))

    const expectedFulfilled = values
      .slice(0, numToFulfill)
      .map((value) => expect.objectContaining({ status: 'fulfilled', value }))

    const expectedRejected = values.slice(numToFulfill).map(() =>
      expect.objectContaining({
        status: 'rejected',
        reason: expect.any(BatchError),
      }),
    )

    const expectedSettled = [...expectedFulfilled, ...expectedRejected]

    await expect(settled).resolves.toEqual(expectedSettled)

    expect(fetch).toHaveBeenCalledTimes(1)
  })

  test('tries to make a new group and succeeds if validate returns false after a group exists and true for the new group', async () => {
    const validate = vi.fn((keys: string[]) => {
      return keys.length === 1
    })

    const fetch = vi.fn((keys: string[]) => {
      const abortController = new AbortController()

      const promise = new Promise<any[]>((resolve, reject) => {
        const timeout = setTimeout(() => {
          resolve(keys)
        }, 100)

        abortController.signal.addEventListener('abort', () => {
          clearTimeout(timeout)
          reject()
        })
      })

      return {
        promise,
        cancel: () => abortController.abort(),
      }
    })

    const dataloader = batchedDataLoader({ validate, fetch })

    const values = ['Elysia', 'Aponia', 'Eden']

    const results = values.map(dataloader.load)

    const settled = Promise.allSettled(results.map((result) => result.promise))

    await expect(settled).resolves.toEqual(
      values.map((value) => expect.objectContaining({ status: 'fulfilled', value })),
    )

    // It will be called three times because each group was restricted to a length of 1,
    // so there was one group for every value.
    expect(fetch).toHaveBeenCalledTimes(values.length)
  })

  test('rejects all promises if abort is called', async () => {
    vi.useFakeTimers()

    const validate = vi.fn(() => true)

    const fetch = vi.fn((keys: string[]) => {
      const abortController = new AbortController()

      const promise = new Promise<any[]>((resolve, reject) => {
        const timeout = setTimeout(() => {
          resolve(keys)
        }, 100)

        abortController.signal.addEventListener('abort', () => {
          clearTimeout(timeout)
          reject()
        })
      })

      return {
        promise,
        cancel: () => abortController.abort(),
      }
    })

    const dataloader = batchedDataLoader({ validate, fetch })

    const values = ['Elysia', 'Aponia', 'Eden']

    const results = values.map(dataloader.load)

    const settled = Promise.allSettled(results.map((result) => result.promise))

    // Cancel the items before they resolve.
    results.forEach((result) => result.cancel())

    // During this time, all the items will be grouped, but not resolved.
    vi.advanceTimersByTime(100)

    await expect(settled).resolves.toEqual(
      values.map(() => expect.objectContaining({ status: 'rejected' })),
    )

    // Since the items were cancelled BEFORE they were in-progress,
    // fetch should never have been called.
    expect(fetch).not.toHaveBeenCalled()

    vi.useRealTimers()
  })

  test('rejects unit resolve uses out-of-bounds index', async () => {
    const validate = vi.fn(() => true)

    const fetch = vi.fn((_keys: string[], unitResolver: (index: number, value: string) => void) => {
      const promise = new Promise<any[]>((resolve, _reject) => {
        setTimeout(() => {
          unitResolver(values.length, 'hi')
          resolve([])
        }, 100)
      })

      return { promise, cancel: () => {} }
    })

    const dataloader = batchedDataLoader({ validate, fetch })

    const values = ['Elysia', 'Aponia', 'Eden']

    const results = values.map(dataloader.load)

    const settled = Promise.allSettled(results.map((result) => result.promise))

    await expect(settled).resolves.toEqual(
      values.map(() => expect.objectContaining({ status: 'rejected' })),
    )

    // Fetch was called once to attempt to resolve the values.
    // It only attempted to resolve one value (i.e. one call to `unitResolver`) for
    // an out-of bounds item, so everything ended up being rejected.
    expect(fetch).toHaveBeenCalledOnce()
  })
})

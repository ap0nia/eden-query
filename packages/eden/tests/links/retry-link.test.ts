import { describe, expect, test, vi } from 'vitest'

import { retryLink } from '../../src/links/retry-link'
import { createChain } from '../../src/links/shared'
import type { Operation, OperationLinkResult } from '../../src/links/types'
import { Observable, promisifyObservable } from '../../src/observable'

describe('retryLink', () => {
  const response = new Response()

  test('throws error if unable to resolve after retrying', async () => {
    const op: Operation = {
      id: 0,
      type: 'query',
      path: '',
      params: {},
      context: {},
    }

    const observable = new Observable((observer) => {
      observer.error({})
    })

    const chain = createChain({
      op,
      links: [
        retryLink({
          retry(opts) {
            // Retry up to 3 times
            return opts.attempts <= 3
          },
        })({}),
        () => {
          return observable
        },
      ],
    })

    await expect(async () => await promisifyObservable(chain)).rejects.toThrow()
  })

  test('invokes retry function the correct number of times', async () => {
    const op: Operation = {
      id: 0,
      type: 'query',
      path: '',
      params: {},
      context: {},
    }

    const fn = vi.fn()

    const observable = new Observable((observer) => {
      observer.error({})
      fn()
    })

    const maxAttempts = 3

    const chain = createChain({
      op,
      links: [
        retryLink({
          retry(opts) {
            // Retry up to 3 times
            return opts.attempts <= maxAttempts
          },
        })({}),
        () => {
          return observable
        },
      ],
    })

    await expect(async () => await promisifyObservable(chain)).rejects.toThrow()

    expect(fn).toHaveBeenCalledTimes(maxAttempts + 1)
  })

  test('resolves correctly', async () => {
    const op: Operation = {
      id: 0,
      type: 'query',
      path: '',
      params: {},
      context: {},
    }

    const fn = vi.fn()

    const maxAttempts = 3

    const result = { hello: 'world' }

    const observable = new Observable((observer) => {
      fn()

      if (fn.mock.calls.length < maxAttempts) {
        observer.error({})
        return
      }

      observer.next(result)
      observer.complete()
    })

    const chain = createChain({
      op,
      links: [
        retryLink({
          retry(opts) {
            // Retry up to 3 times
            return opts.attempts <= maxAttempts
          },
        })({}),
        () => {
          return observable
        },
      ],
    })

    const chainResult = await promisifyObservable(chain)

    expect(chainResult).toBe(result)
    expect(fn).toHaveBeenCalledTimes(maxAttempts)
  })

  test('resolves with event ID', async () => {
    const op: Operation = {
      id: 0,
      type: 'query',
      path: '',
      params: {},
      context: {},
    }

    const fn = vi.fn()

    const maxAttempts = 3

    const id = 'ID'

    const result: OperationLinkResult = {
      result: {
        type: 'data',
        id,
        data: {},
        response,
      },
      context: {},
    }

    const observable = new Observable((observer) => {
      fn()

      if (fn.mock.calls.length < maxAttempts) {
        observer.error({})
        return
      }

      observer.next(result)
      observer.complete()
    })

    const chain = createChain({
      op,
      links: [
        retryLink({
          retry(opts) {
            // Retry up to 3 times
            return opts.attempts <= maxAttempts
          },
        })({}),
        () => {
          return observable
        },
      ],
    })

    const chainResult = await promisifyObservable(chain)

    expect(chainResult).toBe(result)
    expect(fn).toHaveBeenCalledTimes(maxAttempts)
  })
})

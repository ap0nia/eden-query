import { describe, expect, test, vi } from 'vitest'

import { Observable, promisifyObservable } from '../../src/links/internal/observable'
import { type Operation, type OperationResultEnvelope } from '../../src/links/internal/operation'
import { loggerLink } from '../../src/links/logger-link'

describe('loggerLink', () => {
  test('works with default settings', async () => {
    const log = vi.fn()
    const error = vi.fn()

    const createLink = loggerLink({ console: { log, error } })

    const link = createLink({})

    const operation: Operation = {
      id: 0,
      type: 'query',
      params: {},
      context: {},
    }

    const result: OperationResultEnvelope = {
      data: '',
    }

    const observable = new Observable((observer) => {
      const rootObservable = link({
        operation,
        next: () => {
          return new Observable((observer) => {
            observer.next(result)
            observer.complete()
          })
        },
      })
      return rootObservable.subscribe(observer)
    })

    const { promise } = promisifyObservable(observable)

    expect(promise).resolves.toBe(result)

    expect(log).toHaveBeenCalledTimes(2)
    expect(error).not.toHaveBeenCalled()

    // The logger link prints out ">>" to indicate that the request is being passed
    // upstream to be handled.
    expect(log).toHaveBeenNthCalledWith(1, expect.stringContaining('>>'), expect.anything())

    // The logger link prints out "<<" to indicate that the request is being passed
    // downsteam back to the caller.
    expect(log).toHaveBeenNthCalledWith(2, expect.stringContaining('<<'), expect.anything())
  })

  /**
   * TODO: how to test vitest ansi color strings?
   */
  test('no color mode', () => {
    const log = vi.fn()
    const error = vi.fn()

    const createLink = loggerLink({
      console: { log, error },
      colorMode: 'none',
    })

    const link = createLink({})

    const operation: Operation = {
      id: 0,
      type: 'query',
      params: {},
      context: {},
    }

    const result: OperationResultEnvelope = {
      data: '',
    }

    const observable = new Observable((observer) => {
      const rootObservable = link({
        operation,
        next: () => {
          return new Observable((observer) => {
            observer.next(result)
            observer.complete()
          })
        },
      })
      return rootObservable.subscribe(observer)
    })

    const { promise } = promisifyObservable(observable)

    expect(promise).resolves.toBe(result)

    expect(log).toHaveBeenCalledTimes(2)
    expect(error).not.toHaveBeenCalled()

    // The logger link prints out ">>" to indicate that the request is being passed
    // upstream to be handled.
    expect(log).toHaveBeenNthCalledWith(1, expect.stringContaining('>>'), expect.anything())

    // The logger link prints out "<<" to indicate that the request is being passed
    // downsteam back to the caller.
    expect(log).toHaveBeenNthCalledWith(2, expect.stringContaining('<<'), expect.anything())
  })

  /**
   * TODO: how to test vitest css strings?
   */
  test('css color mode', () => {
    const log = vi.fn()
    const error = vi.fn()

    // If `window` is defined, then logger link will use "css" color mode by default.
    globalThis.window = {} as any

    const createLink = loggerLink({
      console: { log, error },
    })

    const link = createLink({})

    const operation: Operation = {
      id: 0,
      type: 'query',
      params: {},
      context: {},
    }

    const result: OperationResultEnvelope = {
      data: '',
    }

    const observable = new Observable((observer) => {
      const rootObservable = link({
        operation,
        next: () => {
          return new Observable((observer) => {
            observer.next(result)
            observer.complete()
          })
        },
      })
      return rootObservable.subscribe(observer)
    })

    const { promise } = promisifyObservable(observable)

    expect(promise).resolves.toBe(result)

    expect(log).toHaveBeenCalledTimes(2)

    // expect(log).toHaveBeenNthCalledWith(1, expect.stringContaining('>>'))

    // expect(log).toHaveBeenNthCalledWith(2, expect.stringContaining('<<'))
  })

  test('uses error log if rejected with error', () => {
    const log = vi.fn()
    const error = vi.fn()

    const createLink = loggerLink({
      console: { log, error },
    })

    const link = createLink({})

    const operation: Operation = {
      id: 0,
      type: 'query',
      params: {},
      context: {},
    }

    /**
     * error will not be called unless this is an instance of an error or
     * is an object with the "error" property.
     */
    const result = new Error('Custom error')

    const observable = new Observable((observer) => {
      const rootObservable = link({
        operation,
        next: () => {
          return new Observable((observer) => {
            observer.error(result)
          })
        },
      })
      return rootObservable.subscribe(observer)
    })

    const { promise } = promisifyObservable(observable)

    expect(promise).rejects.toBe(result)

    // log is called during upstream.
    // error may be called during downstream if an error was returned.

    expect(log).toHaveBeenCalledTimes(1)
    expect(error).toHaveBeenCalledTimes(1)
  })
})

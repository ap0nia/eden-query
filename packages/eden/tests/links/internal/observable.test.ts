import { describe, expect, test, vi } from 'vitest'

import {
  isObservable,
  Observable,
  ObservableAbortError,
  type Observer,
  pipeReducer,
  promisifyObservable,
  Subscribable,
} from '../../../src/links/internal/observable'

describe('Observable', () => {
  test('does nothing if pipe array is empty', () => {
    const next = vi.fn((i: number) => i)
    const error = vi.fn((i: number) => i)
    const complete = vi.fn()

    const observer: Observer<number> = { next, error, complete }

    const value = 1

    const observable = new Observable((observer) => {
      observer.next(value)
    })

    observable.pipe()

    observable.subscribe(observer)

    expect(next).toHaveBeenCalledOnce()
    expect(next).toHaveBeenCalledWith(value)
  })

  test('pipe can interact with the original observable', () => {
    const next = vi.fn((i: number) => i)
    const error = vi.fn((i: number) => i)
    const complete = vi.fn()

    const observer: Observer<number> = { next, error, complete }

    const value = 1
    const modifiedValue = 2

    const observable = new Observable<number>((observer) => {
      observer.next(value)
    })

    const modifiedObservable = observable.pipe((subscribable) => {
      return new Subscribable<number>((observer) => {
        const subscription = subscribable.subscribe({
          next: () => {
            observer.next(modifiedValue)
          },
        })

        return () => {
          subscription.unsubscribe()
        }
      })
    })

    modifiedObservable.subscribe(observer)

    expect(next).toHaveBeenCalledOnce()
    expect(next).toHaveBeenCalledWith(modifiedValue)
  })
})

describe('isObservable', () => {
  describe('false if not an object', () => {
    test('boolean values', () => {
      expect(isObservable(false)).toBe(false)
      expect(isObservable(null)).toBe(false)
    })

    test('nullish values', () => {
      expect(isObservable(undefined)).toBe(false)
      expect(isObservable(null)).toBe(false)
    })

    expect(isObservable(new Date())).toBe(false)
    expect(isObservable(100)).toBe(false)
    expect(isObservable(() => {})).toBe(false)
    expect(isObservable(2n)).toBe(false)
    expect(isObservable(Symbol())).toBe(false)
  })

  describe('true if object with "subscribe" method', () => {
    test('makeshift observable', () => {
      const observable = { subscribe: () => {} }
      expect(isObservable(observable)).toBe(true)
    })

    test('official observable', () => {
      const observable = new Observable(() => {})
      expect(isObservable(observable)).toBe(true)
    })
  })
})

describe('pipeReducer', () => {
  test('calls next function with previous value', () => {
    const finalValue = 'Bye'
    const previousValue = 'Hello'
    const next = vi.fn(() => finalValue)

    const result = pipeReducer(previousValue, next)

    expect(result).toBe(finalValue)
    expect(next).toHaveBeenCalledOnce()
    expect(next).toHaveBeenCalledWith(previousValue)
  })
})

describe('Subscribable', () => {
  test('calls onSubscribe', () => {
    const onSubscribe = vi.fn()

    const subscribable = new Subscribable(onSubscribe)

    subscribable.subscribe()

    expect(onSubscribe).toHaveBeenCalledOnce()

    expect(onSubscribe).toHaveBeenCalledWith(
      expect.objectContaining({
        next: expect.anything(),
        error: expect.anything(),
        complete: expect.anything(),
      }),
    )
  })

  test('calls observer methods', () => {
    const next = vi.fn((i: number) => i)
    const error = vi.fn((i: number) => i)
    const complete = vi.fn()

    const unsubscribe = vi.fn()

    const observer: Observer<number> = { next, error, complete }

    const value = 1

    const onSubscribe = (observer: Observer<number>) => {
      observer.next(value)
      return unsubscribe
    }

    const subscribable = new Subscribable(onSubscribe)

    const subscription = subscribable.subscribe(observer)

    expect(next).toHaveBeenCalledOnce()
    expect(next).toHaveBeenCalledWith(value)
    expect(error).not.toHaveBeenCalled()
    expect(complete).not.toHaveBeenCalled()
    expect(unsubscribe).not.toHaveBeenCalled()

    subscription.unsubscribe()

    expect(unsubscribe).toHaveBeenCalledOnce()
  })

  test('unsubscribes immediately if the onSubscribe function calls complete', () => {
    const next = vi.fn((i: number) => i)
    const error = vi.fn((i: number) => i)
    const complete = vi.fn()

    const unsubscribe = vi.fn()

    const observer: Observer<number> = { next, error, complete }

    const onSubscribe = (observer: Observer<number>) => {
      observer.complete()
      return unsubscribe
    }

    const subscribable = new Subscribable(onSubscribe)

    const subscription = subscribable.subscribe(observer)

    expect(next).not.toHaveBeenCalled()
    expect(error).not.toHaveBeenCalled()
    expect(complete).toHaveBeenCalledOnce()
    expect(unsubscribe).toHaveBeenCalledOnce()

    subscription.unsubscribe()
  })

  test('unsubscribes immediately if the onSubscribe function calls error', () => {
    const next = vi.fn((i: number) => i)
    const error = vi.fn((i: number) => i)
    const complete = vi.fn()

    const unsubscribe = vi.fn()

    const value = 1

    const observer: Observer<number, number> = { next, error, complete }

    const onSubscribe = (observer: Observer<number, number>) => {
      observer.error(value)
      return unsubscribe
    }

    const subscribable = new Subscribable(onSubscribe)

    const subscription = subscribable.subscribe(observer)

    expect(next).not.toHaveBeenCalled()
    expect(error).toHaveBeenCalled()
    expect(complete).not.toHaveBeenCalled()
    expect(unsubscribe).toHaveBeenCalledOnce()

    subscription.unsubscribe()
  })

  test('calls unsubscribes object with unsubscribe method', () => {
    const unsubscribe = vi.fn()

    const complete = vi.fn()

    const observer: Observer<number, number> = {
      next: () => {},
      error: () => {},
      complete,
    }

    const onSubscribe = (observer: Observer<number, number>) => {
      observer.complete()
      return { unsubscribe }
    }

    const subscribable = new Subscribable(onSubscribe)

    const subscription = subscribable.subscribe(observer)

    expect(unsubscribe).toHaveBeenCalledOnce()
    expect(unsubscribe).toHaveBeenCalledOnce()

    subscription.unsubscribe()
  })
})

describe('promisifyObservable', () => {
  test('aborting the promise will throw an error', async () => {
    const observable = new Observable<number>(() => {})

    const { promise, abort } = promisifyObservable(observable)

    abort()

    await expect(() => promise).rejects.toThrowError(ObservableAbortError)
  })

  test('calling next will resolve the promise with the provided value', async () => {
    const next = vi.fn((i: number) => i)
    const error = vi.fn((i: number) => i)
    const complete = vi.fn()

    const observer: Observer<number> = { next, error, complete }

    const value = 100

    const observable = new Observable<number>((observer) => {
      observer.next(value)
    })

    const { promise } = promisifyObservable(observable)

    expect(next).not.toHaveBeenCalled()

    observable.subscribe(observer)

    expect(next).toHaveBeenCalledOnce()
    expect(next).toHaveBeenCalledWith(value)

    await expect(promise).resolves.toBe(value)
  })

  test('calling methods again will not do anything if done', async () => {
    const next = vi.fn((i: number) => i)
    const error = vi.fn((i: number) => i)
    const complete = vi.fn()

    const observer: Observer<number> = { next, error, complete }

    const value = 100

    const observable = new Observable<number>((observer) => {
      observer.error(value)

      // Subscription is already done, these should not do anything.

      observer.next(value)
      observer.error(value)
      observer.complete()
    })

    const { promise } = promisifyObservable(observable)

    expect(error).not.toHaveBeenCalled()

    observable.subscribe(observer)

    expect(error).toHaveBeenCalledOnce()
    expect(error).toHaveBeenCalledWith(value)

    await expect(promise).rejects.toBe(value)
  })

  test('calling error will reject the promise with the provided value', async () => {
    const next = vi.fn((i: number) => i)
    const error = vi.fn((i: number) => i)
    const complete = vi.fn()

    const observer: Observer<number> = { next, error, complete }

    const value = 100

    const observable = new Observable<number>((observer) => {
      observer.error(value)
    })

    const { promise } = promisifyObservable(observable)

    expect(error).not.toHaveBeenCalled()

    observable.subscribe(observer)

    expect(error).toHaveBeenCalledOnce()
    expect(error).toHaveBeenCalledWith(value)

    await expect(promise).rejects.toBe(value)
  })

  test('calling complete will not resolve', async () => {
    const next = vi.fn((i: number) => i)
    const error = vi.fn((i: number) => i)
    const complete = vi.fn()

    const observer: Observer<number> = { next, error, complete }

    const observable = new Observable<number>((observer) => {
      observer.complete()
    })

    const { promise } = promisifyObservable(observable)

    const fn = vi.fn(async () => await promise)

    expect(error).not.toHaveBeenCalled()

    observable.subscribe(observer)

    // TODO: better way to test that it will not resolve?
    expect(fn).not.toHaveResolved()
  })
})

describe('ObservableAbortError', () => {
  test('can be constructed', () => {
    expect(() => new ObservableAbortError()).not.toThrowError()
  })
})

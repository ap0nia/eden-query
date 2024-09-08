import { describe, expect, test, vi } from 'vitest'

import { type Observer, Subscribable } from '../../../src/links/internal/observable'
import { map, share, tap } from '../../../src/links/internal/operators'

describe('tap', () => {
  test('calls both the original and the tapped methods with the same value', () => {
    const next1 = vi.fn()
    const next2 = vi.fn()
    const error1 = vi.fn()
    const error2 = vi.fn()
    const complete1 = vi.fn()
    const complete2 = vi.fn()

    const observer1: Observer = {
      next: next1,
      error: error1,
      complete: complete1,
    }

    const observer2: Observer = {
      next: next2,
      error: error2,
      complete: complete2,
    }

    const value = 'Elysia'
    const errorValue = 'corruption'

    const createTappedSubscribable = tap(observer2)

    const subscribable = new Subscribable((observer) => {
      observer.next(value)
      observer.error(errorValue)
    })

    const tappedSubscribable = createTappedSubscribable(subscribable)

    tappedSubscribable.subscribe(observer1)

    expect(next1).toHaveBeenCalledOnce()
    expect(next1).toHaveBeenCalledWith(value)
    expect(error1).toHaveBeenCalledOnce()
    expect(error1).toHaveBeenCalledWith(errorValue)

    expect(next2).toHaveBeenCalledOnce()
    expect(next2).toHaveBeenCalledWith(value)
    expect(error2).toHaveBeenCalledOnce()
    expect(error2).toHaveBeenCalledWith(errorValue)
  })

  test('calls both the original and the tapped complete methods', () => {
    const complete1 = vi.fn()
    const complete2 = vi.fn()

    const observer1: Observer = {
      next: () => {},
      error: () => {},
      complete: complete1,
    }

    const observer2: Observer = {
      next: () => {},
      error: () => {},
      complete: complete2,
    }

    const createTappedSubscribable = tap(observer2)

    const subscribable = new Subscribable((observer) => {
      observer.complete()
    })

    const tappedSubscribable = createTappedSubscribable(subscribable)

    tappedSubscribable.subscribe(observer1)

    expect(complete1).toHaveBeenCalledOnce()
    expect(complete2).toHaveBeenCalledOnce()
  })
})

describe('map', () => {
  test('transforms the original value before calling the next function', () => {
    const next = vi.fn()
    const error = vi.fn()

    const observer1: Observer = {
      next,
      error,
      complete: () => {},
    }

    const value = 'Elysia'
    const newValue = 'Aponia'
    const errorValue = 'corruption'

    const createMappedSubscribable = map(() => newValue)

    const subscribable = new Subscribable((observer) => {
      observer.next(value)
      observer.error(errorValue)
    })

    const tappedSubscribable = createMappedSubscribable(subscribable)

    tappedSubscribable.subscribe(observer1)

    expect(next).toHaveBeenCalledOnce()
    expect(next).toHaveBeenCalledWith(newValue)

    expect(error).toHaveBeenCalledOnce()
    expect(error).toHaveBeenCalledWith(errorValue)
  })

  test('calls complete method', () => {
    const complete = vi.fn()

    const observer1: Observer = {
      next: () => {},
      error: () => {},
      complete,
    }

    const createMappedSubscribable = map(() => {})

    const subscribable = new Subscribable((observer) => {
      observer.complete()
    })

    const tappedSubscribable = createMappedSubscribable(subscribable)

    tappedSubscribable.subscribe(observer1)

    expect(complete).toHaveBeenCalledOnce()
  })
})

describe('share', () => {
  test('calls all next and error functions with correct value', () => {
    vi.useFakeTimers()

    const next = vi.fn()
    const error = vi.fn()

    const observer: Observer = {
      next,
      error,
      complete: () => {},
    }

    const createShared = share()

    const value = 1

    const subscribable = new Subscribable((observer) => {
      setTimeout(() => {
        observer.next(value)

        setTimeout(() => {
          observer.error(value)
        }, 1000)
      }, 1000)
    })

    const shared = createShared(subscribable)

    const subscriptions = Array.from(Array(5).keys()).map(shared.subscribe.bind(shared, observer))

    vi.advanceTimersByTime(1000)

    expect(next).toHaveBeenCalledTimes(subscriptions.length)
    expect(next).toHaveBeenLastCalledWith(value)

    vi.advanceTimersByTime(1000)

    expect(error).toHaveBeenCalledTimes(subscriptions.length)
    expect(error).toHaveBeenLastCalledWith(value)

    subscriptions.forEach((s) => s.unsubscribe())

    vi.useRealTimers()
  })

  test('calls all complete functions', () => {
    vi.useFakeTimers()

    const complete = vi.fn()

    const observer: Observer = {
      next: () => {},
      error: () => {},
      complete,
    }

    const createShared = share()

    const subscribable = new Subscribable((observer) => {
      setTimeout(() => {
        observer.complete()
      }, 1000)
    })

    const shared = createShared(subscribable)

    const subscriptions = Array.from(Array(5).keys()).map(shared.subscribe.bind(shared, observer))

    vi.advanceTimersByTime(1000)

    expect(complete).toHaveBeenCalledTimes(subscriptions.length)

    subscriptions.forEach((s) => s.unsubscribe())

    vi.useRealTimers()
  })
})

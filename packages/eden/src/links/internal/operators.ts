import type {
  MonoTypeOperatorFunction,
  Observer,
  OperatorFunction,
  Unsubscribable,
} from './observable'
import { Observable } from './observable'

export function map<TValueBefore, TError, TValueAfter>(
  project: (value: TValueBefore, index: number) => TValueAfter,
): OperatorFunction<TValueBefore, TError, TValueAfter, TError> {
  return (source) => {
    const observable = new Observable((subscriber) => {
      let index = 0

      const subscription = source.subscribe({
        next: (value) => {
          subscriber.next(project(value, index++))
        },
        error: (error) => {
          subscriber.error(error)
        },
        complete: () => {
          subscriber.complete()
        },
      })
      return subscription
    })
    return observable
  }
}

interface ShareOptions {}

export function share<TValue, TError>(
  _options?: ShareOptions,
): MonoTypeOperatorFunction<TValue, TError> {
  return (source) => {
    let refCount = 0

    let subscription: Unsubscribable | null = null

    const observers: Partial<Observer<TValue, TError>>[] = []

    const startIfNeeded = () => {
      if (subscription != null) return

      subscription = source.subscribe({
        next: (value) => {
          for (const observer of observers) {
            observer.next?.(value)
          }
        },
        error: (error) => {
          for (const observer of observers) {
            observer.error?.(error)
          }
        },
        complete: () => {
          for (const observer of observers) {
            observer.complete?.()
          }
        },
      })
    }

    const resetIfNeeded = () => {
      if (refCount === 0 && subscription != null) {
        const _sub = subscription
        subscription = null
        _sub.unsubscribe()
      }
    }

    return new Observable((subscriber) => {
      refCount++

      observers.push(subscriber)

      startIfNeeded()

      return {
        unsubscribe: () => {
          refCount--

          resetIfNeeded()

          const index = observers.findIndex((observer) => observer === subscriber)

          if (index >= 0) {
            observers.splice(index, 1)
          }
        },
      }
    })
  }
}

export function tap<TValue, TError>(
  observer: Partial<Observer<TValue, TError>>,
): MonoTypeOperatorFunction<TValue, TError> {
  return (source) => {
    return new Observable((subscriber) => {
      const subscription = source.subscribe({
        next: (value) => {
          observer.next?.(value)
          subscriber.next(value)
        },
        error: (error) => {
          observer.error?.(error)
          subscriber.error(error)
        },
        complete: () => {
          observer.complete?.()
          subscriber.complete()
        },
      })
      return subscription
    })
  }
}

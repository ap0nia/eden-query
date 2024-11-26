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
    let referenceCount = 0

    let subscription: Unsubscribable | null = null

    const observers: Partial<Observer<TValue, TError>>[] = []

    const startIfNeeded = () => {
      if (subscription != undefined) return

      // Make shallow copy of observers in case they unsubscribe during the loop.

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
      if (referenceCount === 0 && subscription != undefined) {
        const _sub = subscription
        subscription = null
        _sub.unsubscribe()
      }
    }

    return new Observable((observer) => {
      referenceCount++

      observers.push(observer)

      startIfNeeded()

      return {
        unsubscribe: () => {
          referenceCount--

          resetIfNeeded()

          const index = observers.findIndex((observer) => observer === observer)

          if (index !== -1) {
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

import type { Noop } from '../utils/noop'

export type TeardownLogic = Unsubscribable | Noop | void

export type UnaryFunction<TSource = any, TReturn = any> = (source: TSource) => TReturn

export type MonoTypeOperatorFunction<TValue, TError> = OperatorFunction<
  TValue,
  TError,
  TValue,
  TError
>

export type OperatorFunction<
  TValueBefore = any,
  TErrorBefore = any,
  TValueAfter = any,
  TErrorAfter = any,
> = UnaryFunction<Subscribable<TValueBefore, TErrorBefore>, Subscribable<TValueAfter, TErrorAfter>>

export interface Unsubscribable {
  unsubscribe(): void
}

export interface Subscribable<TValue, TError> {
  subscribe(observer: Partial<Observer<TValue, TError>>): Unsubscribable
}

export interface Observer<TValue, TError> {
  next: (value: TValue) => void
  error: (err: TError) => void
  complete: () => void
}

/**
 * @public
 */
export type InferObservableValue<TObservable> = TObservable extends Observable<
  infer TValue,
  unknown
>
  ? TValue
  : never

export interface Observable<TValue = any, TError = any> extends Subscribable<TValue, TError> {
  pipe(): Observable<TValue, TError>

  pipe<TValue1, TError1>(
    op1: OperatorFunction<TValue, TError, TValue1, TError1>,
  ): Observable<TValue1, TError1>

  pipe<TValue1, TError1, TValue2, TError2>(
    op1: OperatorFunction<TValue, TError, TValue1, TError1>,
    op2: OperatorFunction<TValue1, TError1, TValue2, TError2>,
  ): Observable<TValue2, TError2>

  pipe<TValue1, TError1, TValue2, TError2, TValue3, TError3>(
    op1: OperatorFunction<TValue, TError, TValue1, TError1>,
    op2: OperatorFunction<TValue1, TError1, TValue2, TError2>,
    op3: OperatorFunction<TValue2, TError2, TValue3, TError3>,
  ): Observable<TValue2, TError2>

  pipe<TValue1, TError1, TValue2, TError2, TValue3, TError3, TValue4, TError4>(
    op1: OperatorFunction<TValue, TError, TValue1, TError1>,
    op2: OperatorFunction<TValue1, TError1, TValue2, TError2>,
    op3: OperatorFunction<TValue2, TError2, TValue3, TError3>,
    op4: OperatorFunction<TValue3, TError3, TValue4, TError4>,
  ): Observable<TValue2, TError2>

  pipe<TValue1, TError1, TValue2, TError2, TValue3, TError3, TValue4, TError4, TValue5, TError5>(
    op1: OperatorFunction<TValue, TError, TValue1, TError1>,
    op2: OperatorFunction<TValue1, TError1, TValue2, TError2>,
    op3: OperatorFunction<TValue2, TError2, TValue3, TError3>,
    op4: OperatorFunction<TValue3, TError3, TValue4, TError4>,
    op5: OperatorFunction<TValue4, TError4, TValue5, TError5>,
  ): Observable<TValue2, TError2>
}

class ObservableAbortError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ObservableAbortError'
    Object.setPrototypeOf(this, ObservableAbortError.prototype)
  }
}

/**
 * @public
 */
export function createObservable<TValue = any, TError = any>(
  subscribe: (observer: Observer<TValue, TError>) => TeardownLogic,
): Observable<TValue, TError> {
  const observable: Observable<TValue, TError> = {
    subscribe: (observer) => {
      let unsubscribe: Noop | undefined = () => {
        if (typeof teardown === 'function') {
          teardown()
        } else if (teardown) {
          teardown.unsubscribe()
        }
      }

      const teardown = subscribe({
        next: (value) => {
          if (unsubscribe == null) return
          observer.next?.(value)
        },
        error: (err) => {
          if (unsubscribe == null) return
          observer.error?.(err)
          unsubscribe()
          unsubscribe = undefined
        },
        complete: () => {
          if (unsubscribe == null) return
          observer.complete?.()
          unsubscribe()
          unsubscribe = undefined
        },
      })

      return { unsubscribe }
    },
    pipe: (...operations: OperatorFunction[]): Observable => {
      return operations.reduce(pipeReducer, observable)
    },
  }
  return observable
}

/**
 * @internal
 */
export function promisifyObservable<T>(observable: Observable<T, unknown>) {
  const abortController = new AbortController()

  const promise = new Promise<T>((resolve, reject) => {
    let isDone = false

    const onAbort = () => {
      if (isDone) return
      isDone = true
      reject(new ObservableAbortError('This operation was aborted.'))
      $observable.unsubscribe()
      abortController.signal.removeEventListener('abort', onAbort)
    }

    const $observable = observable.subscribe({
      next: (data) => {
        isDone = true
        resolve(data)
      },
      error: (data) => {
        isDone = true
        reject(data)
      },
      complete: () => {
        isDone = true
      },
    })

    abortController.signal.addEventListener('abort', onAbort)
  })

  return { promise, abortController }
}

/**
 * @public
 */
export function isObservable(x: unknown): x is Observable<unknown, unknown> {
  return typeof x === 'object' && x !== null && 'subscribe' in x
}

export function pipeReducer(previousValue: any, next: UnaryFunction) {
  return next(previousValue)
}

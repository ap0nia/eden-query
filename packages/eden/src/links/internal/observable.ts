/* eslint-disable no-dupe-class-members */

import { type Noop, noop } from '../../utils/noop'

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

export type Observer<TValue, TError> = {
  next: (value: TValue) => void
  error: (err: TError) => void
  complete: () => void
}

export type Unsubscribable = {
  unsubscribe(): void
}

export type InferObservableValue<TObservable> =
  TObservable extends Observable<infer TValue, unknown> ? TValue : never

export function isObservable(x: unknown): x is Observable<unknown, unknown> {
  return typeof x === 'object' && x !== null && 'subscribe' in x
}

export function pipeReducer(previousValue: any, next: UnaryFunction) {
  return next(previousValue)
}

export function promisifyObservable<T>(observable: Observable<T>) {
  let abort = noop

  const promise = new Promise<T>((resolve, reject) => {
    let isDone = false

    const onDone = () => {
      if (isDone) return
      isDone = true
      reject(new ObservableAbortError('This operation was aborted.'))
      obs$.unsubscribe()
    }

    const obs$ = observable.subscribe({
      next: (data) => {
        isDone = true
        resolve(data)
        onDone()
      },
      error: (data) => {
        isDone = true
        reject(data)
        onDone()
      },
      complete: () => {
        isDone = true
        onDone()
      },
    })

    abort = onDone
  })

  return { promise, abort }
}

export class ObservableAbortError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ObservableAbortError'
    Object.setPrototypeOf(this, ObservableAbortError.prototype)
  }
}

export class Subscribable<TValue, TError> {
  constructor(public onSubscribe: (observer: Observer<TValue, TError>) => TeardownLogic) {}

  subscribe(observer: Partial<Observer<TValue, TError>>): Unsubscribable {
    let teardownRef: TeardownLogic | null = null
    let isDone = false
    let unsubscribed = false
    let teardownImmediately = false

    let unsubscribe = () => {
      if (unsubscribed) return

      if (teardownRef === null) {
        teardownImmediately = true
        return
      }

      unsubscribed = true

      if (typeof teardownRef === 'function') {
        teardownRef()
      } else if (teardownRef) {
        teardownRef.unsubscribe()
      }
    }

    teardownRef = this.onSubscribe({
      next: (value) => {
        if (isDone) return
        observer.next?.(value)
      },
      error: (err) => {
        if (isDone) return
        isDone = true
        observer.error?.(err)
        unsubscribe()
      },
      complete: () => {
        if (isDone) return
        isDone = true
        observer.complete?.()
        unsubscribe()
      },
    })

    if (teardownImmediately) {
      unsubscribe()
    }

    return {
      unsubscribe,
    }
  }
}

export class Observable<TValue = any, TError = any> extends Subscribable<TValue, TError> {
  constructor(onSubscribe: (observer: Observer<TValue, TError>) => TeardownLogic) {
    super(onSubscribe)
  }

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

  pipe(...operations: OperatorFunction[]): Observable {
    return operations.reduce(pipeReducer, this)
  }
}

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

export type Observer<TValue = any, TError = any> = {
  next: (value: TValue) => void
  error: (error: TError) => void
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
  constructor(message?: string) {
    super(message)
    this.name = 'ObservableAbortError'
    Object.setPrototypeOf(this, ObservableAbortError.prototype)
  }
}

export class Subscribable<TValue = any, TError = any> {
  constructor(public onSubscribe: (observer: Observer<TValue, TError>) => TeardownLogic) {}

  subscribe(observer?: Partial<Observer<TValue, TError>>): Unsubscribable {
    let teardownReference: TeardownLogic | null = null
    let isDone = false
    let unsubscribed = false
    let teardownImmediately = false

    let unsubscribe = () => {
      if (unsubscribed) return

      if (teardownReference === null) {
        teardownImmediately = true
        return
      }

      unsubscribed = true

      if (typeof teardownReference === 'function') {
        teardownReference()
      } else if (teardownReference) {
        teardownReference.unsubscribe()
      }
    }

    teardownReference = this.onSubscribe({
      next: (value) => {
        if (isDone) return
        observer?.next?.(value)
      },
      error: (error) => {
        if (isDone) return
        isDone = true
        observer?.error?.(error)
        unsubscribe()
      },
      complete: () => {
        if (isDone) return
        isDone = true
        observer?.complete?.()
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
  ): Observable<TValue3, TError3>

  pipe<TValue1, TError1, TValue2, TError2, TValue3, TError3, TValue4, TError4>(
    op1: OperatorFunction<TValue, TError, TValue1, TError1>,
    op2: OperatorFunction<TValue1, TError1, TValue2, TError2>,
    op3: OperatorFunction<TValue2, TError2, TValue3, TError3>,
    op4: OperatorFunction<TValue3, TError3, TValue4, TError4>,
  ): Observable<TValue4, TError4>

  pipe<TValue1, TError1, TValue2, TError2, TValue3, TError3, TValue4, TError4, TValue5, TError5>(
    op1: OperatorFunction<TValue, TError, TValue1, TError1>,
    op2: OperatorFunction<TValue1, TError1, TValue2, TError2>,
    op3: OperatorFunction<TValue2, TError2, TValue3, TError3>,
    op4: OperatorFunction<TValue3, TError3, TValue4, TError4>,
    op5: OperatorFunction<TValue4, TError4, TValue5, TError5>,
  ): Observable<TValue5, TError5>

  pipe(...operations: OperatorFunction[]): Observable {
    // eslint-disable-next-line unicorn/no-array-reduce
    return operations.reduce((accumulator, element) => pipeReducer(accumulator, element), this)
  }
}

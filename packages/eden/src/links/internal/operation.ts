import type { AnyElysia } from 'elysia'

import type { EdenRequestParams as EdenRequestParameters } from '../../resolve'
import type { Observable, Observer } from './observable'

export type OperationType = 'query' | 'mutation' | 'subscription'

export interface OperationContext extends Record<string, unknown> {}

export type Operation<T extends AnyElysia = any> = {
  id: number
  type: OperationType
  params: EdenRequestParameters<T>
  context: OperationContext
}

export type OperationLink<
  TElysia extends AnyElysia = AnyElysia,
  TInput = unknown,
  TOutput = unknown,
> = (
  options: OperationLinkOptions<TElysia, TInput, TOutput>,
) => OperationResultObservable<TElysia, TOutput>

export type OperationLinkOptions<
  TElysia extends AnyElysia = AnyElysia,
  _TInput = unknown,
  TOutput = unknown,
> = {
  operation: Operation<TElysia>
  next: (operation: Operation<TElysia>) => OperationResultObservable<TElysia, TOutput>
}

export type OperationResultObservable<TElysia extends AnyElysia, TOutput> = Observable<
  OperationResultEnvelope<TOutput>,
  EdenClientError<TElysia>
>

export type OperationResultObserver<TRoute extends AnyElysia, TOutput> = Observer<
  OperationResultEnvelope<TOutput>,
  EdenClientError<TRoute>
>

export type OperationResultEnvelope<T = any> = (EdenResultMessage<T> | EdenSuccessResponse<T>) & {
  context?: OperationContext
}

export type EdenResultMessage<T> =
  | { type: 'started'; data?: never }
  | { type: 'stopped'; data?: never }
  | { data: T; type: 'data' }

export type EdenSuccessResponse<T> = { data: T; type?: 'data' }

export type EdenLink<T extends AnyElysia = any, TMeta = {}> = ((
  options: EdenClientRuntime,
) => OperationLink<T>) &
  TMeta

export type EdenClientRuntime = {}

export type EdenClientOptions<T extends AnyElysia> = {
  links: EdenLink<T>[]
}

/**
 * TODO: placeholder for TRPCClientError<TInferrable>.
 */
export type EdenClientError<_T extends AnyElysia> = any

export class OperationError extends Error {
  constructor(message?: string) {
    super(message)
  }
}

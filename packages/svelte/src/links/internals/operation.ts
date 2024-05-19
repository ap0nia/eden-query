import type { EdenRequestParams } from '../../internal/resolve'
import type { JSONRPC2 } from '../../internal/rpc'
import type { AnyElysia } from '../../types'
import type { Observable, Observer } from './observable'

/**
 * TODO: placeholder for TRPCClientError<TInferrable>.
 */
export type OperationError<_T extends AnyElysia> = any

export type OperationType = 'query' | 'mutation' | 'subscription'

export type OperationContext = {}

export type Operation<T = unknown> = {
  id: number
  type: OperationType
  params: EdenRequestParams<T>
  context?: OperationContext
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
  TInput = unknown,
  TOutput = unknown,
> = {
  operation: Operation<TInput>
  next: (operation: Operation<TInput>) => OperationResultObservable<TElysia, TOutput>
}

export type OperationResultObservable<TElysia extends AnyElysia, TOutput> = Observable<
  OperationResultEnvelope<TOutput>,
  OperationError<TElysia>
>

export type OperationResultObserver<TRoute extends AnyElysia, TOutput> = Observer<
  OperationResultEnvelope<TOutput>,
  OperationError<TRoute>
>

export interface OperationResultEnvelope<TOutput> {
  result: EdenResultMessage<TOutput>['result'] | EdenSuccessResponse<TOutput>['result']
  context?: OperationContext
}

export type EdenResultMessage<T> = JSONRPC2.ResultResponse<
  { type: 'started'; data?: never } | { type: 'stopped'; data?: never } | { data: T; type: 'data' }
>

export type EdenSuccessResponse<T> = JSONRPC2.ResultResponse<{ data: T; type?: 'data' }>

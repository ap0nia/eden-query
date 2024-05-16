import type { RouteSchema } from 'elysia'
import type { Observer } from './observable'

/**
 * @internal
 */
export type CancelFn = () => void

/**
 * @internal
 */
export type PromiseAndCancel<TValue> = {
  promise: Promise<TValue>
  cancel: CancelFn
}

/**
 * @internal
 */
export interface OperationContext extends Record<string, unknown> {}

/**
 * @internal
 */
export type Operation<TInput = unknown> = {
  id: number
  type: 'mutation' | 'query' | 'subscription'
  input: TInput
  path: string
  context: OperationContext
}

interface HeadersInitEsque {
  [Symbol.iterator](): IterableIterator<[string, string]>
}

/**
 * @internal
 */
export type HTTPHeaders = HeadersInitEsque | Record<string, string[] | string | undefined>

/**
 * The default `fetch` implementation has an overloaded signature. By convention this library
 * only uses the overload taking a string and options object.
 */
export type TRPCFetch = (url: string, options?: RequestInit) => Promise<ResponseEsque>

export interface TRPCClientRuntime {
  // nothing here anymore
}

/**
 * @internal
 */
export interface OperationResultEnvelope<TOutput> {
  result: TRPCResultMessage<TOutput>['result'] | TRPCSuccessResponse<TOutput>['result']
  context?: OperationContext
}

/**
 * @internal
 */
export type OperationResultObservable<
  TInferrable extends InferrableClientTypes,
  TOutput,
> = Observable<OperationResultEnvelope<TOutput>, TRPCClientError<TInferrable>>

/**
 * @internal
 */
export type OperationResultObserver<TRoute extends RouteSchema, TOutput> = Observer<
  OperationResultEnvelope<TOutput>,
  TRPCClientError<TInferrable>
>

/**
 * @internal
 */
export type OperationLink<TRoute extends RouteSchema, TInput = unknown, TOutput = unknown> = (
  options: OperationLinkOptions<TRoute, TInput, TOutput>,
) => OperationResultObservable<TRoute, TOutput>

export type OperationLinkOptions<
  TRoute extends RouteSchema,
  TInput = unknown,
  TOutput = unknown,
> = {
  operation: Operation<TInput>
  next: (op: Operation<TInput>) => OperationResultObservable<TRoute, TOutput>
}

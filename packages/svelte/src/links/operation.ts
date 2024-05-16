import type { Observable } from './observable'

/**
 * @internal
 */
export type OperationLink<TInput = any, TOutput = any, TError = any> = (
  options: OperationLinkOptions<TInput, TOutput, TError>,
) => Observable<TOutput, TError>

export type OperationLinkOptions<TInput = any, TOutput = any, TError = any> = {
  operation: TInput
  next: (operation: TInput) => Observable<TOutput, TError>
}

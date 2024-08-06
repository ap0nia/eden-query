import type { InferRouteError, InferRouteOptions, InferRouteOutput } from '@elysiajs/eden'
import type {
  CreateBaseQueryOptions,
  CreateQueryResult,
  DefinedCreateQueryResult,
  InitialDataFunction,
  QueryOptions,
  SkipToken,
  StoreOrVal,
} from '@tanstack/svelte-query'
import type { RouteSchema } from 'elysia'

/**
 * Additional options for queries.
 */
export type EdenCreateQueryBaseOptions = {
  /**
   * eden-related options
   */
  eden?: EdenQueryRequestOptions
}

export type EdenCreateQueryOptions<
  TOutput,
  TData,
  TError,
  TQueryOptsData = TOutput,
> = DistributiveOmit<
  CreateBaseQueryOptions<TOutput, TError, TData, TQueryOptsData, any>,
  'queryKey'
> &
  EdenCreateQueryBaseOptions

export type EdenDefinedCreateQueryOptions<
  TOutput,
  TData,
  TError,
  TQueryOptsData = TOutput,
> = DistributiveOmit<
  CreateBaseQueryOptions<TOutput, TError, TData, TQueryOptsData, any>,
  'queryKey'
> &
  EdenCreateQueryBaseOptions & {
    initialData: InitialDataFunction<TQueryOptsData> | TQueryOptsData
  }

export type EdenCreateQueryResult<TData, TError> = CreateQueryResult<TData, TError> & EdenHookResult

export type EdenDefinedCreateQueryResult<TData, TError> = DefinedCreateQueryResult<TData, TError> &
  EdenHookResult

export interface EdenCreateQuery<
  TRoute extends RouteSchema,
  _TPath extends any[] = [],
  TInput = InferRouteOptions<TRoute>,
  TOutput = InferRouteOutput<TRoute>,
  TError = InferRouteError<TRoute>,
> {
  <TQueryFnData extends TOutput = TOutput, TData = TQueryFnData>(
    input: StoreOrVal<{} extends TInput ? void | TInput : TInput>,
    options: StoreOrVal<EdenDefinedCreateQueryOptions<TQueryFnData, TData, TError, TOutput>>,
  ): EdenDefinedCreateQueryResult<TData, TError>

  <TQueryFnData extends TOutput = TOutput, TData = TQueryFnData>(
    input: StoreOrVal<({} extends TInput ? void | TInput : TInput) | SkipToken>,
    options?: StoreOrVal<EdenCreateQueryOptions<TQueryFnData, TData, TError, TOutput>>,
  ): EdenCreateQueryResult<TData, TError>
}

export interface EdenQueryOptions<TData, TError>
  extends DistributiveOmit<QueryOptions<TData, TError, TData, any>, 'queryKey'>,
    EdenCreateQueryBaseOptions {
  queryKey: EdenQueryKey
}

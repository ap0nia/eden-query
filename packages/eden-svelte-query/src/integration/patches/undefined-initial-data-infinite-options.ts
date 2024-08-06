import type {
  CreateInfiniteQueryOptions,
  DefaultError,
  InfiniteData,
  QueryKey,
} from '@tanstack/svelte-query'

/**
 * @TODO: add this type to svelte-query...
 */
export type UndefinedInitialDataInfiniteOptions<
  TQueryFnData,
  TError = DefaultError,
  TData = InfiniteData<TQueryFnData>,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
> = CreateInfiniteQueryOptions<TQueryFnData, TError, TData, TQueryFnData, TQueryKey, TPageParam> & {
  initialData?: undefined
}

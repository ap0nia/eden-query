import { dehydrate, type DehydratedState, type QueryClient } from '@tanstack/svelte-query'

export function mergeDehydrated(
  source: DehydratedState | QueryClient,
  destination: DehydratedState,
): DehydratedState {
  const dehydratedSource = 'mount' in source ? dehydrate(source) : source

  destination.queries.push(...dehydratedSource.queries)
  destination.mutations.push(...dehydratedSource.mutations)

  return destination
}

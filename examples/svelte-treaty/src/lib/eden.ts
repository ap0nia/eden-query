import { createEdenTreatyQuery, type TreatyCreateQuery } from '@ap0nia/eden-svelte-query'

import type { App } from '$lib/server'

export const eden = createEdenTreatyQuery<App>()

/**
 * Example for inferring.
 */
export type Infer = (typeof eden)['api']['wait']['get']['createQuery'] extends TreatyCreateQuery<
  infer TRoute,
  infer TPath
>
  ? { a: TRoute; b: TPath }
  : never

import type { QueryKey } from '@tanstack/svelte-query'

import type { LOCALS_SSR_KEY } from './constants'

declare global {
  namespace App {
    interface Locals {
      [LOCALS_SSR_KEY]: Map<QueryKey, any>
    }
  }
}

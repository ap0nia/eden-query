import type { EdenTreatyQueryContext } from '@ap0nia/eden-svelte-query'
import type { DehydratedState } from '@tanstack/svelte-query'

import type { App as ElysiaApp } from '$lib/server'

declare global {
  namespace App {
    interface Locals {
      /**
       * Eden utilities are a non-POJO, so they have to be shared via hooks.
       */
      eden: EdenTreatyQueryContext<ElysiaApp>

      /**
       */
      dehydrated: DehydratedState
    }
  }
}

export {}

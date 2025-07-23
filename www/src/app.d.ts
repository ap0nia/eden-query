/**
 * Adds properties to store from-markdown and to-markdown extensions on {@link Data},
 * which is stored in a {@link Processor}
 */
import 'remark'

import type { DehydratedState, QueryClient } from '@tanstack/svelte-query'

import type { Account } from '$lib/server/db/auth/account'
import type { Session } from '$lib/server/db/auth/session'
import type { User } from '$lib/server/db/auth/user'

declare global {
  /**
   * @see https://svelte.dev/docs/kit/types#app.d.ts
   */
  namespace App {
    // interface Error {}

    interface Locals {
      queryClient: QueryClient

      dehydrated: DehydratedState

      session?: Session & {
        user: User
        account?: Account | null
      }

      accessToken?: string | null

      refreshToken?: string | null
    }

    // interface PageState {}
    // interface Platform {}
  }
}

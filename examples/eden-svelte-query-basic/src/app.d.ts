// See https://kit.svelte.dev/docs/types#app

import type { DehydratedState } from '@tanstack/svelte-query'

// for information about these interfaces
declare global {
  namespace App {
    // interface Error {}

    interface Locals {
      dehydrated: DehydratedState
    }

    // interface PageData {}
    // interface PageState {}
    // interface Platform {}
  }
}

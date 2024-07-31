import type { StoreOrVal } from '@tanstack/svelte-query'
import type { Readable } from 'svelte/store'

export function isStore<T>(obj: StoreOrVal<T>): obj is Readable<T> {
  return (
    obj != null && typeof obj === 'object' && 'subscribe' in obj && 'set' in obj && 'update' in obj
  )
}

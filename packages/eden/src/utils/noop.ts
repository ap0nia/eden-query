export function noop() {
  /* noop */
}

export async function asyncNoop() {
  /* noop */
}

export function constNoop<T>(value: T): () => T {
  return () => value
}

export function asyncConstNoop<T>(value: T): () => Promise<T> {
  return async () => value
}

export type Noop = typeof noop

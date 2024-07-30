export type Nullish = null | undefined | void

export function notNull<T>(value: T): value is NonNullable<T> {
  return value != null
}

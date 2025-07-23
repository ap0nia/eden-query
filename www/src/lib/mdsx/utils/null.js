/**
 * @template T
 * @param {T} value
 * @returns value is NonNullable<T>
 */
export function notNull(value) {
  return value != null
}

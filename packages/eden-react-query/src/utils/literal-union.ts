/**
 * Allows you to get autocomplete even when allowing arbitrary values.
 *
 * For example, `'a' | 'b' | LiteralUnion<string>` allows any arbitrary string, but you
 * get autocomplete for the value.
 */
export type LiteralUnion<T> = T & { _?: any }

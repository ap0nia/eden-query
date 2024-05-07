/**
 * Simple utility that overrides top level properties from `T` with the matching properties from `U`.
 */
export type Override<T, U> = Omit<T, keyof U> & U

/**
 * Converts an empty object to void.
 *
 * Useful for marking arguments to functions as optional.
 *
 * @see [Playground Link](https://www.typescriptlang.org/play/?ssl=5&ssc=14&pln=1&pc=1#code/GYVwdgxgLglg9mABAWwJ4DFzXmAFANwEMAbEAUwC5F84YATRAH0TBGQCMyAnASkQG8AUIkRcyUEFyRFSZQQF9BaTJFgJcPJRixq8ARh5A)
 *
 * @example
 * ```ts
 * // value is marked as required, but "void" makes it optional.
 * function myFunction(value: void | number) {
 *   return value
 * }
 *
 * // Both are valid calls.
 *
 * myFunction()
 * myFunction(1)
 * ```
 *
 */
export type EmptyToVoid<T> = {} extends T ? void | T : T

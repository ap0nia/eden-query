/**
 * Additional properties appended to react-query hooks by the library.
 *
 * The hooks are scoped to an `eden` property on the hook.
 *
 * @example
 *
 * const hello = eden.hello.useQuery()
 *
 * const edenPath = hello.eden.path
 */
export type EdenQueryHookExtension = {
  /**
   */
  eden: EdenQueryHookExtensionImplementation
}

/**
 * The actual top-level properties.
 */
export type EdenQueryHookExtensionImplementation = {
  /**
   * The path used to make the request.
   *
   * @example
   *
   * '/api/a/index'
   */
  path: string
}

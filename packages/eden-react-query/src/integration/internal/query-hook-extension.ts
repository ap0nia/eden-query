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
export type WithEdenQueryExtension<T = {}> = T & {
  /**
   * Additional object appended by eden-query.
   */
  eden: EdenExtendedQueryHooks
}

/**
 * Additional hooks added to the original react-query hook result.
 */
export type EdenExtendedQueryHooks = {
  /**
   * The path used to make the request.
   *
   * @example
   *
   * '/api/a/index'
   */
  path: string
}

export type EdenQueryExtensionInput = {
  path: readonly string[]
}

export function getEdenQueryExtension(input: EdenQueryExtensionInput): EdenExtendedQueryHooks {
  const path = input.path.join('.')

  const eden: EdenExtendedQueryHooks = { path }

  return eden
}

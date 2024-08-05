import { useMemo } from 'react'

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

export function appendEdenQueryExtension<T extends WithEdenQueryExtension>(
  originalHook: T,
  input: EdenQueryExtensionInput,
): T {
  const path = input.path.join('.')

  const memoizedEden = useMemo(() => {
    const eden: EdenExtendedQueryHooks = { path }
    return eden
  }, [path])

  originalHook.eden = memoizedEden

  return originalHook
}

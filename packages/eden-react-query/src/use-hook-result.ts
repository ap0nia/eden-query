import * as React from 'react'

import type { EdenQueryHookExtension } from './hook'

/**
 * Makes a stable reference of the `trpc` prop
 */
export function useHookResult(value: { path: readonly string[] }): EdenQueryHookExtension['eden'] {
  const path = value.path.join('.')
  return React.useMemo(() => ({ path }), [path])
}

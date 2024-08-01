import * as React from 'react'

import type { EdenHookResult } from './hook'

/**
 * Makes a stable reference of the `trpc` prop
 */
export function useHookResult(value: { path: readonly string[] }): EdenHookResult['eden'] {
  const path = value.path.join('.')
  return React.useMemo(() => ({ path }), [path])
}

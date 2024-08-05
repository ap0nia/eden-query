import type { AnyElysia } from 'elysia'
import { useMemo } from 'react'

import type { EdenTreatyQueryConfig } from './config'
import { createEdenTreatyQueryRootHooks } from './root-hooks'

const useContextAliases = ['useContext', 'useUtils']

export function createEdenTreatyReactQuery<TElysia extends AnyElysia, TSSRContext = unknown>(
  config?: EdenTreatyQueryConfig<TElysia>,
): EdenTreatyQueryHooks<TElysia, TSSRContext> {
  const rootHooks = createEdenTreatyQueryRootHooks(config)

  const edenTreatyReactQueryProxy = createEdenTreatyReactQueryProxy(rootHooks, config)

  const edenTreatyReactQuery = new Proxy(() => {}, {
    get: (_target, path: string, _receiver): any => {
      if (useContextAliases.includes(path)) {
        const customUseContext = (context = rootHooks.useUtils()) => {
          // Create and return a stable reference of the utils context.
          return useMemo(() => createReactQueryUtils(context), [context])
        }
        return customUseContext
      }

      if (Object.prototype.hasOwnProperty.call(rootHooks, path)) {
        return rootHooks[path as never]
      }

      return edenTreatyReactQueryProxy[path as never]
    },
  })

  return edenTreatyReactQuery as any
}

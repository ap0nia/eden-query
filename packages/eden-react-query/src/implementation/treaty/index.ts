import type { AnyElysia } from 'elysia'
import { useMemo } from 'react'

import { createUtilityFunctions, type EdenContextProps } from '../../context'
import type { EdenTreatyQueryConfig } from './config'
import { createEdenTreatyQueryRootHooks } from './root-hooks'

export function createEdenTreatyReactQuery<TElysia extends AnyElysia, TSSRContext = unknown>(
  config?: EdenTreatyQueryConfig<TElysia>,
): EdenTreatyQueryHooks<TElysia, TSSRContext> {
  const rootHooks = createEdenTreatyQueryRootHooks(config)

  const edenTreatyReactQueryProxy = createEdenTreatyReactQueryProxy(rootHooks, config)

  const edenTreatyReactQuery = new Proxy(() => {}, {
    get: (_target, path: string, _receiver): any => {
      if (path === 'useContext' || path === 'useUtils') {
        return (context = rootHooks.useUtils()) => {
          // create a stable reference of the utils context
          return useMemo(() => {
            return createReactQueryUtils(context)
          }, [context])
        }
      }

      if (path === 'createUtils') {
        return (props: EdenContextProps<TElysia, TSSRContext>) => {
          const { abortOnUnmount = false, client, queryClient, ssrContext } = props

          const ssrState = props.ssrState ?? false

          const utilityFunctions = createUtilityFunctions({ client, queryClient })

          const context = {
            abortOnUnmount,
            queryClient,
            client,
            ssrContext: ssrContext ?? null,
            ssrState,
            ...utilityFunctions,
          }

          return createReactQueryUtils(context)
        }
      }

      if (Object.prototype.hasOwnProperty.call(rootHooks, path)) {
        return rootHooks[path as never]
      }

      return edenTreatyReactQueryProxy[path as never]
    },
  })

  return edenTreatyReactQuery as any
}

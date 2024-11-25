import type Elysia from 'elysia'
import type { AnyElysia } from 'elysia'

import type { EdenQueryConstraints, EdenQueryStoreKey } from '../constraints'
import { batchPlugin } from './batch'
import { transformPlugin } from './transform'
import type { GenericElysiaPlugin } from './types'

export type EdenPluginOptions = EdenQueryConstraints

/**
 * Combines both the batch and transform plugins, ___and orders them properly___.
 *
 * The transform plugin (if used) needs to be set before the batch plugin.
 *
 * --
 *
 * Type Invariants
 *
 * > Constraints that are captured on the type-level.
 *
 * If the server has enabled batching, the client can use batching if desired.
 * If the server has NOT enabled batching, the client can NOT use a batch link.
 *
 * If the server has enabled a transformer, the client MUST apply the same transformer.
 * If the server has NOT enabled any transformers, the client can opt-in to using a transformer;
 *   this is at your own risk, since eden allows transformers to be specified for any request,
 *   but it's not guranteed to be parsed correctly by the server...
 */
export function safeEdenPlugin<T extends EdenQueryConstraints>(config: T) {
  const plugin = <BasePath extends string>(
    elysia: Elysia<BasePath>,
  ): Elysia<
    BasePath,
    false,
    {
      decorator: {}
      store: Record<
        typeof EdenQueryStoreKey,
        T['batch'] extends undefined
          ? T['transformer'] extends undefined
            ? {}
            : { transformer: T['transformer'] }
          : T['transformer'] extends undefined
            ? { batch: T['batch'] }
            : T
      >
      derive: {}
      resolve: {}
    }
  > => {
    let current: AnyElysia = elysia

    if (config.transformer) {
      current = current.use(transformPlugin(config.transformer))
    }

    if (config.batch) {
      const batchConfig = typeof config.batch === 'boolean' ? undefined : config.batch
      current = current.use(batchPlugin(batchConfig))
    }

    return current
  }

  return plugin
}

/**
 * Combines both the batch and transform plugins, ___and orders them properly___.
 *
 * The transform plugin (if used) needs to be set before the batch plugin.
 *
 * --
 *
 * Type Invariants
 *
 * > Constraints that are captured on the type-level.
 *
 * If the server has enabled batching, the client can use batching if desired.
 * If the server has NOT enabled batching, the client can NOT use a batch link.
 *
 * If the server has enabled a transformer, the client MUST apply the same transformer.
 * If the server has NOT enabled any transformers, the client can opt-in to using a transformer;
 *   this is at your own risk, since eden allows transformers to be specified for any request,
 *   but it's not guranteed to be parsed correctly by the server...
 */
export function edenPlugin<T extends Elysia = Elysia>(
  config: EdenQueryConstraints,
): GenericElysiaPlugin<T> {
  return safeEdenPlugin(config) as any
}

export * from './batch'
export * from './transform'

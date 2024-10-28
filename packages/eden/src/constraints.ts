import type { DataTransformerOptions } from './links/internal/transformer'
import type { BatchPluginOptions } from './plugins'

/**
 * Custom key for storing metadata for this library in an Elysia.js store.
 */
export const EdenQueryStoreKey = Symbol('EdenQueryStoreKey')

/**
 * Constraints that are stored on an Elysia.js application that can be read by the client.
 *
 * Plugins will mutate the store at the {@link EdenQueryStoreKey} key.
 *
 * e.g. The batch plugin will set store[EdenQueryStoreKey].batch = true on the type-level.
 */
export type EdenQueryConstraints = {
  /**
   * Whether the application uses a transformer.
   */
  transformer?: DataTransformerOptions

  /**
   * Whether the application has applied the batch plugin.
   *
   * @fixme
   * This file, "constraints", is a general file, but it's importing {@link BatchPluginOptions}
   * from a specific implementation file...
   */
  batch?: boolean | BatchPluginOptions
}

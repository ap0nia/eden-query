import {
  type DefinitionBase,
  Elysia,
  type EphemeralType,
  type MetadataBase,
  type RouteBase,
  type SingletonBase,
} from 'elysia'

import type { EdenQueryStoreKey } from '../constraints'
import { type DataTransformerOptions, getDataTransformer } from '../links/internal/transformer'

/**
 * @fixme:
 *
 * TS 4118 The type of this node cannot be serialized because its property '[EdenQueryStoreKey]' cannot be serialized.
 */
export function transformPlugin<T extends DataTransformerOptions>(transformer: T) {
  const resolvedTransformer = getDataTransformer(transformer)

  const plugin = <
    BasePath extends string,
    Scoped extends boolean,
    Singleton extends SingletonBase,
    Definitions extends DefinitionBase,
    Metadata extends MetadataBase,
    Routes extends RouteBase,
    Ephemeral extends EphemeralType,
    Volatile extends EphemeralType,
  >(
    elysia: Elysia<BasePath, Scoped, Singleton, Definitions, Metadata, Routes, Ephemeral, Volatile>,
  ): Elysia<
    BasePath,
    false,
    {
      decorator: {}
      store: Record<typeof EdenQueryStoreKey, { transformer: T }>
      derive: {}
      resolve: {}
    }
  > => {
    /**
     * No transformer provided or found...
     */
    if (resolvedTransformer == null) {
      return elysia as any
    }

    const withTransforms = elysia
      /**
       * De-serialize incoming JSON data from the client using SuperJSON.
       */
      .onParse(async (context) => {
        if (context.contentType !== 'application/json') return

        const json = await context.request.json()

        return await resolvedTransformer.input.deserialize(json)
      })
      /**
       * Serialize outgoing JSON data from the server using SuperJSON.
       */
      .mapResponse(async (context) => {
        // TODO: when should responses not be transformed?
        // if (typeof context.response !== 'object') return

        /**
         * If it's already a response, don't transform it?
         */
        if (context.response instanceof Response) return

        const serializedResponse = await resolvedTransformer.output.serialize(context.response)

        const text = JSON.stringify(serializedResponse)

        return new Response(text, {
          headers: {
            'Content-Type': 'application/json',
          },
        })
      })

    return withTransforms as any
  }

  return plugin
}

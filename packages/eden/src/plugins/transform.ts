import { Elysia } from 'elysia'
import { ElysiaCustomStatusResponse } from 'elysia/error'

import type { EdenQueryStoreKey } from '../constraints'
import { type DataTransformerOptions, getDataTransformer } from '../links/internal/transformer'
import type { GenericElysiaPlugin } from './types'

function isError(response: unknown): boolean {
  if (response == null) {
    return false
  }

  if (response instanceof ElysiaCustomStatusResponse) {
    return true
  }

  // For some reason, instanceof does not reliably detect if it is the right instance...
  if (response.constructor.name === ElysiaCustomStatusResponse.name) {
    return true
  }

  if (response instanceof Error) {
    return true
  }

  return false
}

/**
 * @fixme:
 *
 * TS 4118 The type of this node cannot be serialized because its property '[EdenQueryStoreKey]' cannot be serialized.
 *
 * Turn off declaration: true and declarationMap: true
 */
export function safeTransformPlugin<T extends DataTransformerOptions>(transformer: T) {
  const resolvedTransformer = getDataTransformer(transformer)

  const plugin = <BasePath extends string>(
    elysia: Elysia<BasePath>,
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
       *
       * Currently pending open issue with mapResponse and error
       * @see https://github.com/elysiajs/elysia/issues/854
       */
      .mapResponse(async (context) => {
        // FIXME: upstream, this function should not be called if there was an error.
        // But it might get called anyways...
        if (isError(context.response)) return

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

export function transformPlugin<T extends Elysia = Elysia>(
  transformer: DataTransformerOptions,
): GenericElysiaPlugin<T> {
  return safeTransformPlugin(transformer) as any
}

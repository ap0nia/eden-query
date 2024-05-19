import type { Elysia, RouteSchema } from 'elysia'

import { LOCAL_ADDRESSES } from '../constants'
import type { EdenRequestOptions } from '../internal/config'
import type { InferRouteInput, InferRouteOutput } from '../internal/infer'

export type InferTreatyQueryIO<T extends Elysia<any, any, any, any, any, any, any, any>> =
  T extends {
    _routes: infer TSchema extends Record<string, any>
  }
    ? InferTreatyQueryIOMapping<TSchema>
    : 'Please install Elysia before using Eden'

export type InferTreatyQueryIOMapping<
  TSchema extends Record<string, any>,
  TPath extends any[] = [],
> = {
  [K in keyof TSchema]: TSchema[K] extends RouteSchema
    ? {
        input: InferRouteInput<TSchema[K], Extract<K, string>>
        output: InferRouteOutput<TSchema[K]>
      }
    : InferTreatyQueryIOMapping<TSchema[K], [...TPath, K]>
}

export type InferTreatyQueryInput<T extends Elysia<any, any, any, any, any, any, any, any>> =
  T extends {
    _routes: infer TSchema extends Record<string, any>
  }
    ? InferTreatyQueryInputMapping<TSchema>
    : 'Please install Elysia before using Eden'

export type InferTreatyQueryInputMapping<
  TSchema extends Record<string, any>,
  TPath extends any[] = [],
> = {
  [K in keyof TSchema]: TSchema[K] extends RouteSchema
    ? InferRouteInput<TSchema[K], Extract<K, string>>
    : InferTreatyQueryInputMapping<TSchema[K], [...TPath, K]>
}

export type InferTreatyQueryOutput<T extends Elysia<any, any, any, any, any, any, any, any>> =
  T extends {
    _routes: infer TSchema extends Record<string, any>
  }
    ? InferTreatyQueryOutputMapping<TSchema>
    : 'Please install Elysia before using Eden'

export type InferTreatyQueryOutputMapping<
  TSchema extends Record<string, any>,
  TPath extends any[] = [],
> = {
  [K in keyof TSchema]: TSchema[K] extends RouteSchema
    ? InferRouteOutput<TSchema[K]>
    : InferTreatyQueryOutputMapping<TSchema[K], [...TPath, K]>
}

export function resolveDomain(domain: string, config: EdenRequestOptions) {
  if (!config.keepDomain) {
    if (!domain.includes('://')) {
      const localAddressIndex = LOCAL_ADDRESSES.findIndex((address) => domain.includes(address))
      const origin = localAddressIndex === -1 ? 'https://' : 'http://'
      return origin + domain
    }

    if (domain.endsWith('/')) {
      return domain.slice(0, -1)
    }
  }

  return domain
}

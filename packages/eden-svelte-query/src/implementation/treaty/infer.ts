import type {
  HttpQueryMethod,
  InferRouteBody,
  InferRouteOptions,
  InferRouteOutput,
} from '@ap0nia/eden'
import type { AnyElysia, RouteSchema } from 'elysia'

export type InferTreatyQueryIO<T extends AnyElysia> = T extends {
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
        input: K extends HttpQueryMethod
          ? InferRouteOptions<TSchema[K], Extract<K, string>>
          : [
              InferRouteBody<TSchema[K], Extract<K, string>>,
              InferRouteOptions<TSchema[K], Extract<K, string>>,
            ]
        output: InferRouteOutput<TSchema[K]>
      }
    : InferTreatyQueryIOMapping<TSchema[K], [...TPath, K]>
}

export type InferTreatyQueryInput<T extends AnyElysia> = T extends {
  _routes: infer TSchema extends Record<string, any>
}
  ? InferTreatyQueryInputMapping<TSchema>
  : 'Please install Elysia before using Eden'

export type InferTreatyQueryInputMapping<
  TSchema extends Record<string, any>,
  TPath extends any[] = [],
> = {
  [K in keyof TSchema]: TSchema[K] extends RouteSchema
    ? K extends HttpQueryMethod
      ? InferRouteOptions<TSchema[K], Extract<K, string>>
      : [
          InferRouteBody<TSchema[K], Extract<K, string>>,
          InferRouteOptions<TSchema[K], Extract<K, string>>,
        ]
    : InferTreatyQueryInputMapping<TSchema[K], [...TPath, K]>
}

export type InferTreatyQueryOutput<T extends AnyElysia> = T extends {
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

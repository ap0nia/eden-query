/**
 *
 * An eden-treaty proxy may look like these examples:
 *
 * eden.api.products.get({ limit: 5 })
 * eden.api.product({ id: 'product-id' }).details.get({ limit: 5 })
 *
 * In the first example, the proxy is called like a function at the very end, so it is trivial
 * to infer that the arguments are the query parameters for fetch request.
 *
 * In the second example, there are two function calls, and we need to heuristically determine whether
 * it is a function call to insert a path parameter, or the actual end.
 *
 * Heuristic: A path parameter function call needs exactly one object with exactly one key passed as an argument.
 */
export function getPathParam(arguments_: unknown[]) {
  if (arguments_.length !== 1) {
    return
  }

  const argument = arguments_[0]

  if (argument == undefined || typeof argument !== 'object') {
    return
  }

  const argumentKeys = Object.keys(argument)

  const pathParameter = argumentKeys[0]

  if (argumentKeys.length !== 1 || pathParameter == undefined) {
    return
  }

  return { param: argument as any, key: argumentKeys[0] }
}

/**
 * Only maps over keys that represents valid route params. i.e. path segments that begin with colon.
 */
export type ExtractEdenTreatyRouteParams<T> = {
  [K in keyof T as K extends `:${string}` ? K : never]: T[K]
}

/**
 * Create an object that maps the name of the route param to possible values (string or number).
 *
 * @example
 *
 * '/products/:id'
 *
 * :id is a path parameter, and this would return { id: string | number }
 *
 * Eden will recognize this object as a path parameter.
 *
 * @see https://elysiajs.com/eden/treaty/overview.html#dynamic-path
 */
export type ExtractEdenTreatyRouteParamsInput<T> = {
  [K in keyof T as K extends `:${infer TParameter}` ? TParameter : never]: string | number
}

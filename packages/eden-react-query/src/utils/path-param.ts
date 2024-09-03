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
export function getPathParam(...args: unknown[]) {
  if (args.length === 0) {
    return
  }

  const argument = args[0]

  if (argument == null || typeof argument !== 'object') {
    return
  }

  const argumentValues = Object.values(argument)

  const pathParam = argumentValues[0]

  if (argumentValues.length !== 1 || pathParam == null) {
    return
  }

  return pathParam
}

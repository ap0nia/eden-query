import type { EdenTreatyQueryRootHooks } from '../implementation/treaty'
import type { LiteralUnion } from './literal-union'

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
export function getPathParam(args: unknown[]) {
  if (args.length === 0) {
    return
  }

  const argument = args[0]

  if (argument == null || typeof argument !== 'object') {
    return
  }

  const argumentKeys = Object.keys(argument)

  const pathParam = argumentKeys[0]

  if (argumentKeys.length !== 1 || pathParam == null) {
    return
  }

  // At this point, assume that it's either a StoreOrVal with a valid object representing route params.

  return { param: argument as any, key: argumentKeys[0] }
}

/**
 * The positional index of the `input` provided to root query hooks.
 *
 * `undefined` if the function does not receive `input`.
 */
const inputPositions: Partial<
  Record<keyof EdenTreatyQueryRootHooks | LiteralUnion<string>, number>
> = {
  createQuery: 0,
  createInfiniteQuery: 0,
}

/**
 * Directly mutate the arguments passed to the root hooks.
 *
 * Make sure that the interpretation of args matches up with the implementation of root hooks.
 */
export function mutateArgs(
  hook: keyof EdenTreatyQueryRootHooks | LiteralUnion<string>,
  args: unknown[],
  params: Record<string, any>[],
) {
  const inputPosition = inputPositions[hook]

  if (inputPosition == null) {
    return args
  }

  const query = args[inputPosition]

  if (query == null && params.length === 0) {
    return args
  }

  const resolvedParams: Record<string, any> = {}

  for (const param of params) {
    for (const key in param) {
      resolvedParams[key] = param[key]
    }
  }

  const resolvedInput = {
    params: resolvedParams,
    query,
  }

  args[inputPosition] = resolvedInput

  return args
}

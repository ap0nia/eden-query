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
  if (args.length !== 1) {
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
 * Some hooks have `input` provided as the first argument to the root hook.
 * If this is the case, then {@link mutateArgs} needs to ensure that any
 * accummulated path parameters are included.
 */
const hooksWithInput: (keyof EdenTreatyQueryRootHooks | LiteralUnion<string> | symbol)[] = [
  'useQuery',
  'useInfiniteQuery',
  'useSuspenseQuery',
  'useSuspenseInfiniteQuery',
  'useMutation',
]

/**
 * Directly mutate the arguments passed to the root hooks.
 *
 * Make sure that the interpretation of args matches up with the implementation of root hooks.
 */
export function mutateArgs(
  hook: keyof EdenTreatyQueryRootHooks | LiteralUnion<string> | symbol,
  args: unknown[],
  params: Record<string, any>[],
) {
  if (!hooksWithInput.includes(hook)) {
    return args
  }

  const query = args[0]

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

  args[0] = resolvedInput

  return args
}

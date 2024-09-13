import type { StoreOrVal } from '@tanstack/svelte-query'
import { derived, get, type Readable, readable } from 'svelte/store'

import type { EdenTreatyQueryRootHooks } from '../implementation/treaty'
import { isStore } from './is-store'
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

  /**
   * Extract the value of a writable.
   */
  const argumentValue = isStore(argument) ? get(argument) : argument

  if (argumentValue == null || typeof argumentValue !== 'object') {
    return
  }

  const argumentKeys = Object.keys(argumentValue)

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
  params: StoreOrVal<Record<string, any>>[],
) {
  const inputPosition = inputPositions[hook]

  if (inputPosition == null) {
    return args
  }

  const input = args[inputPosition]

  if (input == null && params.length === 0) {
    return args
  }

  const isInputStore = isStore(input)

  if (!isInputStore && !params.length) {
    return args
  }

  const queryStore = isInputStore ? input : readable(input)

  const paramsStores: Readable<Record<string, any>>[] = []

  const staticParams: Record<string, any>[] = []

  for (const param of params) {
    if (isStore(param)) {
      paramsStores.push(param)
    } else {
      staticParams.push(param)
    }
  }

  const paramsStore = derived(paramsStores, ($paramsStores) => {
    const resolvedParams: Record<string, any> = {}

    for (const param of $paramsStores) {
      for (const key in param) {
        resolvedParams[key] = param[key]
      }
    }

    return resolvedParams
  })

  const inputStore = derived([queryStore, paramsStore], ([query, params]) => {
    for (const key in staticParams) {
      params[key] = staticParams[key]
    }
    return { query, params }
  })

  args[inputPosition] = inputStore

  return args
}

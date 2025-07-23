import type { TwoslashShikiReturn } from '@shikijs/twoslash'
import type { CreateTwoslashOptions, TwoslashExecuteOptions } from 'twoslash'

export interface CreateTwoslashSvelteOptions extends CreateTwoslashOptions {
  /**
   * Render the generated code in the output instead of the Svelte file
   *
   * @default false
   */
  debugShowGeneratedCode?: boolean

  /**
   * Path to node_modules where `svelte2tsx` is installed.
   *
   * Defaults to '../node_modules/svelte2tsx'.
   *
   * @example
   *
   * ```ts
   * import path from 'node:path';
   *
   *
   * const nodeModules = '/user/path/node_modules'
   *
   * const svelte2tsx = path.join(nodeModules, 'svelte2tsx')
   * ```
   */
  nodeModules?: string
}

type TwoslashShikiFunction = (
  code: string,
  lang?: string,
  options?: TwoslashExecuteOptions,
) => TwoslashShikiReturn

export function createTwoslasher(createOptions?: CreateTwoslashSvelteOptions): TwoslashShikiFunction

export default createTwoslasher

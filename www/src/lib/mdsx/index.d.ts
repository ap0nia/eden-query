import type { PreprocessorGroup } from 'svelte/compiler'
import type { Processor } from 'unified'

export type AnyProcessor = Processor<any, any, any, any, any>

export type MaybePromise<T> = PromiseLike<T> | T

/**
 * A unified plugin is a function that receives the current unified processor
 * and applies plugins, e.g. remark and rehype plugins.
 *
 * It can mutate the processor and return nothing, or return an entirely new instance.
 */
export type UnifiedPlugin = (
  processor: AnyProcessor,
  config: MdsxPreprocessorConfig,
) => MaybePromise<AnyProcessor | void>

/**
 * MDSX pre-processor configuration.
 *
 * @internal
 */
export interface MdsxPreprocessorConfig {
  /**
   * Extensions of files to pre-process with mdsx.
   */
  extensions?: string[]

  /**
   */
  unified?: UnifiedPlugin

  /**
   * Custom YAML parser.
   */
  frontmatterParser?: (str: string) => Record<string, unknown> | void

  /**
   * Map of custom blueprints. Markdown files can specify "blueprint: name" in their frontmatter
   * to select a specific one.
   *
   * By default, the "default" one will be used if provided.
   */
  blueprints?: Record<string, Blueprint> & { default?: Blueprint }

  /**
   * Pre-processors to apply to the MDX files.
   */
  preprocessors?: PreprocessorGroup[]
}

export type Blueprint = {
  /**
   * Path to the blueprint.
   */
  path: string

  /**
   */
  unified?: UnifiedPlugin
}

/**
 * Convenience type.
 */
export type MarkupPreprocessor = NonNullable<PreprocessorGroup['markup']>

/**
 * Create markup pre-processor for MDX files.
 */
export function createMdsxMarkupPreprocessor(
  config?: MdsxPreprocessorConfig,
): PreprocessorGroup['markup']

/**
 * Create pre-processor for MDX files.
 *
 */
export function createMdsxPreprocessor(config?: MdsxPreprocessorConfig): PreprocessorGroup

/**
 * Alias for {@link createMdsxPreprocessor}.
 */
export const mdsx: typeof createMdsxPreprocessor

/**
 * Alias for {@link createMdsxPreprocessor}.
 */
export const mdsxPreprocess: typeof createMdsxPreprocessor

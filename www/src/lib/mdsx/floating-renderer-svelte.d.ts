import type { RendererRichOptions, TwoslashRenderer } from '@shikijs/twoslash'

/**
 * @see https://github.com/shikijs/shiki/blob/93246cdbd1b9f0c170f4e5db551f11ced03bdfce/packages/vitepress-twoslash/src/renderer-floating-vue.ts#L11
 */
export interface TwoslashFloatingSvelteOptions {
  classCopyIgnore?: string

  classFloatingPanel?: string

  classCode?: string

  classMarkdown?: string

  floatingSvelteTheme?: string

  floatingSvelteThemeQuery?: string

  floatingSvelteThemeCompletion?: string
}

/**
 */
export interface TwoslashFloatingSvelteRendererOptions extends RendererRichOptions {
  floatingSvelte?: TwoslashFloatingSvelteOptions
}

/**
 * Create a floating-renderer for twoslash that uses the rich-renderer to inject custom nodes
 * referencing Svelte components provided by this library.
 */
export function rendererFloatingSvelte(
  options?: TwoslashFloatingSvelteRendererOptions,
): TwoslashRenderer

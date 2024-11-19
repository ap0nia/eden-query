/**
 * File extensions that are assumed to be Svelte files.
 *
 * Mdsx is intended to parse Markdown and MDX files, not regular Svelte files.
 */
export const DEFAULT_SVELTE_EXTENSIONS = ['.svelte']

/**
 * File extensions that are assumed to be MDX files.
 */
export const DEFAULT_MARKDOWN_EXTENSIONS = ['.md']

/**
 * Prefix used for named imports from this library.
 */
export const MDSX_PREFIX = 'MDSX__'

/**
 * The named, default import from the blueprint.
 */
export const MDSX_BLUEPRINT_NAME = `${MDSX_PREFIX}Blueprint`

/**
 * The named, barrel import for the components from the blueprint.
 */
export const MDSX_COMPONENT_NAME = `${MDSX_PREFIX}Component`

/**
 * The named, barrel import for floating-ui components from this library.
 */
export const MDSX_FLOATING_COMPONENT_NAME = `${MDSX_COMPONENT_NAME}__Floating`

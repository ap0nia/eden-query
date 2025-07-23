// @ts-check

import path from 'node:path'

import { compile } from './compile.js'
import { DEFAULT_MARKDOWN_EXTENSIONS } from './constants.js'

/**
 * Create markup pre-processor for MDX files.
 *
 * @type import('.').createMdsxMarkupPreprocessor
 */
export function createMdsxMarkupPreprocessor(config = {}) {
  const extensions = config?.extensions ?? DEFAULT_MARKDOWN_EXTENSIONS

  return async (options) => {
    if (options.filename == null) return

    const fileExtension = path.extname(options.filename)

    if (!extensions.includes(fileExtension)) return

    const result = await compile(options, config)

    return result
  }
}

/**
 * Create pre-processor for MDX files.
 *
 * @type import('.').createMdsxPreprocessor
 */
export function createMdsxPreprocessor(config) {
  /**
   * @type import('svelte/compiler').PreprocessorGroup
   */
  const mdsxPreprocessor = {
    name: 'mdsx',
    markup: createMdsxMarkupPreprocessor(config),
  }

  return mdsxPreprocessor
}

export const mdsx = createMdsxPreprocessor

export const mdsxPreprocess = createMdsxPreprocessor

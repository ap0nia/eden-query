// @ts-check

import fs from 'node:fs'
import path from 'node:path'

import * as acorn from 'acorn'
import { parse, preprocess } from 'svelte/compiler'
import { visit } from 'unist-util-visit'
import { walk } from 'zimmerframe'

import { MDSX_COMPONENT_NAME, MDSX_FLOATING_COMPONENT_NAME } from '../../constants.js'
import { escapeHtmlEntities } from '../../utils/html.js'

/**
 * HTML tag-names that may be a parent of code content.
 */
export const CODE_CONTAINER_TAG_NAMES = ['pre', 'code']

/**
 * HTML tag-names that can contain code content.
 */
export const CODE_ELEMENT_TAG_NAMES = ['element', 'code']

/**
 * Tries to find any floating nodes and update the file metadata.
 *
 * @type import('unified').Plugin
 */
export function rehypeGetFloating() {
  return (tree, file) => {
    const root = /** @type import('hast').Root */ (tree)
    visit(root, 'element', (node) => {
      if (node.tagName.includes(MDSX_FLOATING_COMPONENT_NAME)) {
        file.data['floating'] = true
      }
    })
  }
}

/**
 * @type import('unified').Plugin
 */
export function rehypeRenderCode() {
  return (tree, _file) => {
    const root = /** @type import('hast').Root */ (tree)

    visit(root, 'element', (node) => {
      if (!CODE_CONTAINER_TAG_NAMES.includes(node.tagName)) return

      /**
       * @type import('hast').ElementContent | undefined
       */
      let codeEl = undefined

      if (node.tagName === 'pre') {
        codeEl = node.children[0]
        if (codeEl == null || !CODE_ELEMENT_TAG_NAMES.includes(codeEl?.type)) return
      } else {
        codeEl = node
      }

      // Ensure all content in text nodes are escaped for usage within Svelte components.

      visit(codeEl, 'text', (node) => {
        /**
         * @type import('hast').Raw
         */
        const raw = /** @type any */ (node)

        raw.type = 'raw'
        raw.value = `{@html \`${escapeHtmlEntities(node.value)}\`}`
      })
    })
  }
}

/**
 * Handle element nodes with tag-names that are handled by the selected blueprint.
 * It will convert the original tag-name to a Svelte component call.
 *
 * @example BEFORE
 * ```html
 *   <div></div>
 * ```
 *
 * @example AFTER
 * ```html
 * <MDSX__Component.div></MDSX__Component.div>
 * ```
 *
 * @type import('unified').Plugin
 */
export function rehypeBlueprint() {
  return async (tree, file) => {
    if (file.data.components?.length) {
      const root = /** @type import('hast').Root */ (tree)

      visit(root, 'element', (node) => {
        if (!file.data.components?.includes(node.tagName)) return
        node.tagName = `${MDSX_COMPONENT_NAME}.${node.tagName}`
      })

      return
    }

    const blueprint = file.data.blueprint

    if (blueprint == null) return

    const source = fs.readFileSync(blueprint.path, { encoding: 'utf8' })

    const filename = path.parse(blueprint.path).base

    /**
     * @type string[]
     */
    let namedExports = []

    /**
     * @type acorn.Program
     */
    let program

    if (filename.endsWith('.svelte')) {
      const preprocessors = file.data.preprocessors ?? []

      const { code, dependencies } = await preprocess(source, preprocessors, { filename })

      if (dependencies) {
        file.data.dependencies ??= []
        file.data.dependencies.push(...dependencies)
      }

      const ast = parse(code, { filename })

      const module = ast['module']

      if (module == null) {
        throw new Error(`Unable to read exports from blueprint "${blueprint.path}".`)
      }

      program = module['content']

      namedExports.push('default')
    } else {
      program = acorn.parse(source, { ecmaVersion: 'latest', sourceType: 'module' })
    }

    if (!program) {
      throw new Error(`Unable to parse blueprint "${blueprint.path}".`)
    }

    const state = {}

    /**
     * @type any
     */
    const visitors = {
      /**
       * @param {*} node
       */
      ExportNamedDeclaration(node) {
        for (const specifier of node.specifiers) {
          namedExports.push(specifier.exported.name)
        }
      },
    }

    walk(program, state, visitors)

    if (!namedExports?.length) return

    file.data.components = namedExports

    const root = /** @type import('hast').Root */ (tree)

    visit(root, 'element', (node) => {
      if (!file.data.components?.includes(node.tagName)) return
      node.tagName = `${MDSX_COMPONENT_NAME}.${node.tagName}`
    })
  }
}

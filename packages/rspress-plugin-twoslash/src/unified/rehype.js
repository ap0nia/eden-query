// @ts-check

import path from 'node:path'

import { visit } from 'unist-util-visit'

import { name } from '../../package.json'
import { MDSX_FLOATING_COMPONENT_NAME } from '../constants'

/**
 * Rehype MDX plugin that adds an import statement for the floating components if any floating
 * elements are found in the HAST.
 *
 * @type import('unified').Plugin
 */
export function rehypeFloatingImports() {
  return (tree) => {
    const root = /** @type import('hast').Root */ (tree)

    let floating = false

    visit(root, 'element', (node) => {
      if (node.tagName.includes(MDSX_FLOATING_COMPONENT_NAME)) {
        floating = true
      }
    })

    // No floating nodes found.

    if (!floating) return

    let imported = false

    const moduleLocation = path.join(name, 'floating-components')

    const importStatement = `import * as ${MDSX_FLOATING_COMPONENT_NAME} from ${JSON.stringify(moduleLocation)}`

    visit(root, 'mdxjsEsm', (node) => {
      if (node.value === importStatement) {
        imported = true
      }
    })

    // The correct namespace import has already been found in the MDX file.

    if (imported) return

    /**
     * @see https://github.com/web-infra-dev/rspress/blob/0e693f9e527b0392eaf7d43dbbe29e2f356ebaa9/packages/core/src/node/utils/getASTNodeImport.ts#L5
     *
     * @type import('mdast-util-mdxjs-esm').MdxjsEsm
     */
    const importNode = {
      type: 'mdxjsEsm',
      value: importStatement,
      data: {
        estree: {
          type: 'Program',
          sourceType: 'module',
          body: [
            {
              type: 'ImportDeclaration',
              specifiers: [
                {
                  type: 'ImportNamespaceSpecifier',
                  local: {
                    type: 'Identifier',
                    name: MDSX_FLOATING_COMPONENT_NAME,
                  },
                },
              ],
              source: {
                type: 'Literal',
                value: moduleLocation,
                raw: JSON.stringify(moduleLocation),
              },
            },
          ],
        },
      },
    }

    root.children.push(importNode)
  }
}

// @ts-check

import npmToYarn from 'npm-to-yarn'
import { visit } from 'unist-util-visit'

/**
 * @type import('./remark-npm-to-yarn').remarkNpmToYarn
 */
export function remarkNpmToYarn(options = {}) {
  const converters = options.converters ?? ['npm', 'yarn', 'pnpm', 'bun']

  const sync = options.sync ?? true

  const conversionResolvers = converters.map((converter) => {
    if (typeof converter === 'string') {
      /**
       * @param {string} code
       */
      const resolver = (code) => npmToYarn(code, converter)

      /**
       * @type import('./remark-npm-to-yarn').CustomConverter
       */
      const customConverter = [converter, resolver]

      return customConverter
    }

    return converter
  })

  return (root) => {
    visit(root, 'code', (node, index, parent) => {
      const code = /** @type import('mdast').Code */ (node)

      if (code.meta !== 'npm2yarn') return

      const ancestor = /** @type import('mdast').Parent */ (parent)

      const tabsContentChildren = conversionResolvers.map((conversion) => {
        /**
         * @type import('mdast').TabsContent
         */
        const tabContent = {
          type: 'tabsContent',
          value: conversion[0],
          children: [
            {
              ...code,
              value: conversion[1](code.value),
            },
          ],
        }

        return tabContent
      })

      const names = converters.map((converter) =>
        Array.isArray(converter) ? converter[0] : converter,
      )

      const tabsListChildren = names.map((value) => {
        /**
         * @type import('mdast').TabsTrigger
         */
        const trigger = {
          type: 'tabsTrigger',
          value,
          children: [
            {
              type: 'text',
              value,
            },
          ],
        }

        return trigger
      })

      /**
       * @type import('mdast').TabsList
       */
      const tabsList = {
        type: 'tabsList',
        children: tabsListChildren,
      }

      const children = [tabsList, ...tabsContentChildren]

      ancestor.children[index] = {
        type: 'tabs',
        sync,
        groupId: 'npm2yarn',
        children,
        value: names[0],
      }
    })
  }
}

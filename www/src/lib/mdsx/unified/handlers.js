// @ts-check

import { defaultHandlers } from 'mdast-util-to-hast'

import { notNull } from '../utils/null.js'

/**
 * @type Array<import('mdast').GitHubAlertVariant>
 */
const githubVariants = ['TIP', 'NOTE', 'WARNING', 'CAUTION', 'IMPORTANT']

export const handlers = {
  ...defaultHandlers,

  /**
   * @type import('mdast-util-to-hast').Handler
   */
  tabs(state, node, parent) {
    const tabs = /** @type import('mdast').Tabs */ (node)

    /**
     * @type import('hast').ElementContent
     */
    const element = {
      type: 'element',
      tagName: tabs.type,
      properties: {
        sync: tabs.sync,
        groupId: tabs.groupId,
        value: tabs.value,
      },
      children: tabs.children
        .flatMap((child) => handlers[child.type](state, child, parent))
        .filter(notNull),
    }

    return element
  },
  /**
   * @type import('mdast-util-to-hast').Handler
   */
  tabsList(state, node, parent) {
    const tabsList = /** @type import('mdast').TabsList */ (node)

    /**
     * @type import('hast').ElementContent
     */
    const element = {
      type: 'element',
      tagName: tabsList.type,
      properties: {},
      children: tabsList.children
        .flatMap((child) => handlers[child.type](state, child, parent))
        .filter(notNull),
    }

    return element
  },
  /**
   * @type import('mdast-util-to-hast').Handler
   */
  tabsTrigger(state, node, parent) {
    const tabsTrigger = /** @type import('mdast').TabsTrigger */ (node)

    /**
     * @type import('hast').ElementContent
     */
    const element = {
      type: 'element',
      tagName: tabsTrigger.type,
      properties: {
        value: tabsTrigger.value,
        'data-title': tabsTrigger.value,

        // When this file is being processed, the vitepress plugin will parse for
        // an icon regex match.
        'vitepress-plugin-group-icons': `data-title="${tabsTrigger.value}"`,
      },
      children: tabsTrigger.children
        .flatMap((child) => handlers[child.type](state, child, parent))
        .filter(notNull),
    }

    return element
  },
  /**
   * @type import('mdast-util-to-hast').Handler
   */
  tabsContent(state, node, parent) {
    const tabsContent = /** @type import('mdast').TabsContent */ (node)

    /**
     * @type import('hast').ElementContent
     */
    const element = {
      type: 'element',
      tagName: tabsContent.type,
      properties: {
        value: tabsContent.value,
      },
      children: tabsContent.children
        .flatMap((child) => handlers[child.type](state, child, parent))
        .filter(notNull),
    }

    return element
  },

  /**
   * @type import('mdast-util-to-hast').Handler
   */
  gitHubAlert(state, node, parent) {
    const githubAlert = /** @type import('mdast').GitHubAlert */ (node)

    const { position: _position, children: _children, data: _data, ...properties } = githubAlert

    /**
     * @type import('hast').ElementContent
     */
    const element = {
      type: 'element',
      tagName: githubAlert.type,
      properties,
      children: githubAlert.children
        .flatMap((child) => handlers[child.type](state, child, parent))
        .filter(notNull),
    }

    return element
  },

  /**
   * @type import('mdast-util-to-hast').Handler
   */
  details(state, node, parent) {
    const details = /** @type import('mdast').Details */ (node)

    const { position: _position, children: _children, data: _data, ...properties } = details

    /**
     * @type import('hast').ElementContent
     */
    const element = {
      type: 'element',
      tagName: details.type,
      properties,
      children: details.children
        .flatMap((child) => handlers[child.type](state, child, parent))
        .filter(notNull),
    }

    return element
  },

  /**
   * @type import('mdast-util-to-hast').Handler
   */
  containerDirective(state, node, parent) {
    const container = /** @type import('mdast-util-directive').ContainerDirective */ (node)

    /**
     * @type any
     */
    const uppercaseName = container.name.toUpperCase()

    if (githubVariants.includes(uppercaseName)) {
      const variant = /** @type import('mdast').GitHubAlertVariant */ (uppercaseName)

      /**
       * @type import('mdast').GitHubAlert
       */
      const githubAlert = {
        title: variant,
        ...container.attributes,
        type: 'gitHubAlert',
        variant,
        children: container.children,
      }

      return handlers.gitHubAlert(state, githubAlert, parent)
    }

    const lowercaseName = container.name.toLowerCase()

    switch (lowercaseName) {
      case 'details': {
        /**
         * @type import('mdast').Details
         */
        const details = {
          type: 'details',
          ...container.attributes,
          children: container.children,
        }

        return handlers.details(state, details, parent)
      }

      default: {
        return
      }
    }
  },

  /**
   * @type import('mdast-util-to-hast').Handler
   */
  leafDirective(_state, _node, _parent) {
    return
  },

  /**
   * @type import('mdast-util-to-hast').Handler
   */
  textDirective(_state, _node, _parent) {
    return
  },
}

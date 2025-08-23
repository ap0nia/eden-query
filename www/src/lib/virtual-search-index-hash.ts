import path from 'node:path'

import type { Header, PageIndexInfo } from '@rspress/shared'
import { fromHtml } from 'hast-util-from-html'
import { selectAll } from 'hast-util-select'
import { toString } from 'hast-util-to-string'
import { htmlToText } from 'html-to-text'
import { groupBy } from 'lodash-es'
import type { Component } from 'svelte'
import { render } from 'svelte/server'

import { getRoutePathParts } from '$lib/rspress/node/route/normalizeRoutePath.js'
import { createHash } from '$lib/rspress/node/utils'

const SEARCH_INDEX_NAME = ''

interface DocModule {
  default: Component

  metadata?: Record<string, any>

  [K: string]: any
}

const docsDirectory = '../../docs'

const docs = import.meta.glob('../../docs/**/*.md')

const pagePromises = Object.entries(docs).map(async ([filename, importModule]) => {
  const relativePath = path.relative(docsDirectory, filename)

  const lang = ''

  const version = ''

  const versions: string[] = []

  const langs: string[] = []

  const [versionPart, langPart, _purePathPart] = getRoutePathParts(
    lang,
    relativePath,
    version,
    versions,
    langs,
  )

  const defaultPage: PageIndexInfo = {
    id: 0,
    domain: '',

    title: '',
    content: '',
    _html: '',
    routePath: filename,
    lang: langPart || lang,
    toc: [],
    frontmatter: {},
    version: versionPart || version,
    _filepath: filename,
    _relativePath: relativePath,
  }

  const name = path.basename(filename)

  const doc = (await importModule()) as DocModule

  const rendered = render(doc.default)

  /**
   * Escape JSX elements in code block to allow them to be searched
   * @link https://github.com/sindresorhus/escape-goat/blob/eab4a382fcf5c977f7195e20d92ab1b25e6040a7/index.js#L3
   */
  function encodeHtml(html: string): string {
    return html.replace(
      /<code>([\s\S]*?)<\/\s?code>/gm,
      function (_match: string, innerContent: string) {
        return `<code>${innerContent
          .replace(/&/g, '&amp;') // Must happen first or else it will escape other just-escaped characters.
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#39;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')}</code>`
      },
    )
  }

  const html = encodeHtml(rendered.body)

  const tree = fromHtml(html, { fragment: true })

  const headings = selectAll('h1, h2, h3, h4, h5, h6', tree)

  const toc: Header[] = headings.map((node) => {
    const text = toString(node)

    const id = node.properties['id']?.toString() || text

    const match = id.match(/-(\d+)$/)

    let position = -1

    if (match) {
      for (let i = 0; i < Number(match[1]); i++) {
        // When text is repeated, the position needs to be determined based on -number
        position = text.indexOf(`\n${text}#\n\n`, position + 1)

        // If the positions don't match, it means the text itself may exist -number
        if (position === -1) {
          break
        }
      }
    }

    const header: Header = {
      id: node.properties['id']?.toString() ?? '',
      depth: parseInt(node.tagName.charAt(1)),
      text,
      charIndex: text.indexOf(`\n${text}#\n\n`, position + 1),
    }

    return header
  })

  const content = htmlToText(html, {
    // decodeEntities: true, // default value of decodeEntities is `true`, so that htmlToText can decode &lt; &gt;
    wordwrap: 80,
    selectors: [
      {
        selector: 'a',
        options: {
          ignoreHref: true,
        },
      },
      {
        selector: 'img',
        format: 'skip',
      },
      {
        // Skip code blocks
        selector: 'pre > code',
        // format: searchCodeBlocks ? 'block' : 'skip',
        format: 'block',
      },
      ...['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].map((tag) => ({
        selector: tag,
        options: {
          uppercase: false,
        },
      })),
    ],
    tables: true,
    longWordSplit: {
      forceWrapOnLimit: true,
    },
  })

  const title =
    doc['title'] ||
    doc.metadata?.['title'] ||
    toString(headings[0] || { type: 'text', data: name, value: name })

  const page: PageIndexInfo = {
    ...defaultPage,

    title,
    toc,
    frontmatter: doc.metadata || {},
    _html: html,
    content,
  }

  return page
})

function deletePrivateField<T>(obj: T): T {
  if (typeof obj !== 'object' || obj === null) {
    return obj
  }
  const newObj: T = { ...obj }
  for (const key in newObj) {
    if (key.startsWith('_')) {
      delete newObj[key]
    }
  }
  return newObj
}

export const pages = await Promise.all(pagePromises)

const versioned = undefined

const groupedPages = groupBy(pages, (page) => {
  if (page.frontmatter?.pageType === 'home') {
    return 'noindex'
  }

  const version = versioned ? page.version : ''

  const lang = page.lang || ''

  return `${version}###${lang}`
})

// Remove the pages marked as noindex.
delete groupedPages['noindex']

export const indexHashByGroup: Record<string, string> = {}

export const searchIndex: Record<string, PageIndexInfo[]> = {}

// Generate search index by different versions & languages, file name is {SEARCH_INDEX_NAME}.{version}.{lang}.{hash}.json
await Promise.all(
  Object.keys(groupedPages).map(async (group) => {
    const index = groupedPages[group]?.map(deletePrivateField) ?? []

    // Avoid writing filepath in compile-time
    const stringifiedIndex = JSON.stringify(index)

    const indexHash = createHash(stringifiedIndex)

    indexHashByGroup[group] = indexHash

    const [version, lang] = group.split('###')

    const indexVersion = version ? `.${version.replace('.', '_')}` : ''

    const indexLang = lang ? `.${lang}` : ''

    const segments = [`${SEARCH_INDEX_NAME}${indexVersion}${indexLang}`, indexHash, 'json']

    const filename = segments.filter(Boolean).join('.')

    searchIndex[filename] = index
  }),
)

export const searchIndexHash = indexHashByGroup

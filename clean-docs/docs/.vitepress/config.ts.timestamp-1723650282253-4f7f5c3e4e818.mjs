// docs/.vitepress/config.ts
import { transformerTwoslash } from 'file:///home/aponia/Projects/typescript/hi/node_modules/.pnpm/@shikijs+vitepress-twoslash@1.12.1_typescript@5.5.4/node_modules/@shikijs/vitepress-twoslash/dist/index.mjs'
import ci from 'file:///home/aponia/Projects/typescript/hi/node_modules/.pnpm/ci-info@4.0.0/node_modules/ci-info/index.js'
import {
  bundledLanguages,
  createHighlighter,
} from 'file:///home/aponia/Projects/typescript/hi/node_modules/.pnpm/shiki@1.12.1/node_modules/shiki/dist/index.mjs'
import { defineConfig } from 'file:///home/aponia/Projects/typescript/hi/node_modules/.pnpm/vitepress@1.3.2_@algolia+client-search@4.24.0_@types+node@20.14.14_@types+react@18.3.3_axios@_6dkdwjjkrtmt4443tm3s6h2abu/node_modules/vitepress/dist/node/index.js'

// ../package.json
var repository = {
  type: 'git',
  url: 'https://github.com/ap0nia/eden-query',
}

// docs/.vitepress/npm-to-yarn.ts
import convert from 'file:///home/aponia/Projects/typescript/hi/node_modules/.pnpm/npm-to-yarn@2.2.1/node_modules/npm-to-yarn/dist/npm-to-yarn.mjs'
import { nanoid } from 'file:///home/aponia/Projects/typescript/hi/node_modules/.pnpm/nanoid@5.0.7/node_modules/nanoid/index.js'
var PACKAGE_MANAGERS = ['npm', 'pnpm', 'yarn', 'bun']
var NPM_TO_YARN_KEY = 'npm2yarn'
function extractPackageManager(content) {
  const trimmedContent = content.trim()
  if (trimmedContent.includes('yarn')) {
    return 'yarn'
  }
  if (trimmedContent.includes('pnpm')) {
    return 'pnpm'
  }
  if (trimmedContent.includes('bun')) {
    return 'bun'
  }
  return 'npm'
}
function createCodeGroupLabel(id, checked, group, title) {
  return [
    `<input type="radio" name="group-${group}" id="tab-${id}" ${checked ? 'checked' : ''}>`,
    `  <label for="tab-${id}">${title}`,
    `</label>`,
  ].join('\n')
}
function npmToYarn(options) {
  const plugin = (md) => {
    const fence = md.renderer.rules.fence
    md.renderer.rules.fence = (...args) => {
      const [tokens, idx, ...rest] = args
      const currentToken = tokens[idx]
      if (currentToken == null || !currentToken.info.includes(NPM_TO_YARN_KEY)) {
        return fence?.(tokens, idx, ...rest) ?? ''
      }
      const converters = options?.converters ?? PACKAGE_MANAGERS
      const group = nanoid(7)
      const codeGroupLabels = converters
        .map((converter, index) => {
          const id = nanoid(5)
          const checked = index === 0
          const title = typeof converter === 'string' ? converter : converter[0]
          return createCodeGroupLabel(id, checked, group, title)
        })
        .join('\n')
      const currentPackageManager = extractPackageManager(currentToken.content)
      const npmCommand =
        currentPackageManager === 'npm'
          ? currentToken.content
          : convert(currentToken.content, 'npm')
      const codeGroupBlocks = converters
        .map((converter) => {
          const translatedCommand =
            typeof converter === 'string'
              ? convert(npmCommand, converter)
              : converter[1](npmCommand)
          currentToken.content = translatedCommand
          const markup = fence?.(tokens, idx, ...rest) ?? ''
          return markup
        })
        .join('\n')
      return [
        `<div class="vp-code-group vp-adaptive-theme">`,
        `  <div class="tabs">${codeGroupLabels}</div>`,
        `  <div class="blocks">${codeGroupBlocks}</div>`,
        `</div>`,
      ].join('\n')
    }
  }
  return plugin
}

// docs/.vitepress/magic-move.ts
import { codeToKeyedTokens } from 'file:///home/aponia/Projects/typescript/hi/node_modules/.pnpm/shiki-magic-move@0.4.3_react@18.3.1_shiki@1.12.1_svelte@4.2.18_vue@3.4.36_typescript@5.5.4_/node_modules/shiki-magic-move/dist/core.mjs'
import 'file:///home/aponia/Projects/typescript/hi/node_modules/.pnpm/vitepress@1.3.2_@algolia+client-search@4.24.0_@types+node@20.14.14_@types+react@18.3.3_axios@_6dkdwjjkrtmt4443tm3s6h2abu/node_modules/vitepress/dist/node/index.js'
var MAGIC_MOVE_BLOCK_REGEX = /^:::magic-move(?:[ ]*(\{.*?\})?([^\n]*?))?\n([\s\S]+?)^:::$/gm
var CODE_BLOCK_REGEX =
  /^```([\w'-]+?)(?:\s*\[([^\]]*)\])?(?:\s*{([\d\w*,\|-]+)}\s*?({.*?})?(.*?))?\n([\s\S]+?)^```$/gm
function normalizeRangeStr(rangeStr = '') {
  return !rangeStr.trim()
    ? []
    : rangeStr
        .trim()
        .split(/\|/g)
        .map((i) => i.trim())
}
async function magicMove(md, shiki) {
  md.block.ruler.before('fence', 'magic-move', (state, startLine, _endLine, _silent) => {
    const start = state.bMarks[startLine] + state.tShift[startLine]
    const max = state.eMarks[startLine]
    if (state.src.slice(start, max).startsWith(':::magic-move')) {
      const [containerBlock = ''] = state.src.slice(start).match(MAGIC_MOVE_BLOCK_REGEX) || []
      const matches = Array.from(containerBlock.matchAll(CODE_BLOCK_REGEX))
      if (!matches.length) {
        throw new Error('Magic Move block must contain at least one code block')
      }
      const ranges = matches.map((i) => normalizeRangeStr(i[3]))
      const steps = matches.map((i) => {
        const code = i[6].trimEnd()
        const options = {
          lang: i[1],
          themes: {
            light: 'github-light',
            dark: 'github-dark',
          },
        }
        const keyedTokenInfo = codeToKeyedTokens(shiki, code, options)
        const fileName = i[2] || i[1]
        return { ...keyedTokenInfo, fileName }
      })
      const token = state.push('magic-move_open', 'div', 1)
      token.meta = {
        stepsLz: encodeURIComponent(JSON.stringify(steps)),
        stepRanges: JSON.stringify(ranges),
      }
      state.push('magic-move_close', 'div', -1)
      state.line = startLine + containerBlock.split('\n').length
      return true
    }
    return false
  })
  function renderDefault(tokens, idx) {
    if (tokens[idx].nesting === 1) {
      const { stepsLz, stepRanges } = tokens[idx].meta
      return `<MagicMove steps-lz="${stepsLz}" :step-ranges="${stepRanges}" />`
    }
    return ''
  }
  md.renderer.rules['magic-move_open'] = renderDefault
  md.renderer.rules['magic-move_close'] = renderDefault
}

// docs/.vitepress/twoslash-include.ts
function addIncludes(map, name, code) {
  const lines = []
  code.split('\n').forEach((l, _i) => {
    const trimmed = l.trim()
    if (trimmed.startsWith('// - ')) {
      const key = trimmed.split('// - ')[1].split(' ')[0]
      map.set(`${name}-${key}`, lines.join('\n'))
    } else {
      lines.push(l)
    }
  })
  map.set(name, lines.join('\n'))
}
function replaceIncludesInCode(_map, code) {
  const includes2 = /\/\/ @include: (.*)$/gm
  const toReplace = []
  let match
  while ((match = includes2.exec(code)) !== null) {
    if (match.index === includes2.lastIndex) {
      includes2.lastIndex++
    }
    const key = match[1]
    const replaceWith = _map.get(key)
    if (!replaceWith) {
      const msg = `Could not find an include with the key: '${key}'.
There is: ${Array.from(_map.keys())}.`
      console.error(msg)
    } else {
      toReplace.push([match.index, match[0].length, replaceWith])
    }
  }
  let newCode = code.toString()
  toReplace.reverse().forEach((r) => {
    newCode = newCode.substring(0, r[0]) + r[2] + newCode.substring(r[0] + r[1])
  })
  return newCode
}
var INCLUDE_META_REGEX = /include\s+([\w-]+)\b.*?/
function parseIncludeMeta(meta) {
  if (!meta) return null
  const match = meta.match(INCLUDE_META_REGEX)
  return match?.[1] ?? null
}

// docs/.vitepress/config.ts
var repositoryName = repository.url.split('/').pop() ?? ''
var description =
  'Ergonomic Framework for Humans. TypeScript server framework supercharged by Bun with End-to-End Type Safety, unified type system and outstanding developer experience.'
var includes = /* @__PURE__ */ new Map()
var config = defineConfig({
  lang: 'en-US',
  title: 'ElysiaJS',
  base: ci.GITHUB_ACTIONS ? `/${repositoryName.replace('.git', '')}/` : '',
  ignoreDeadLinks: true,
  lastUpdated: true,
  markdown: {
    config: async (md) => {
      md.use(npmToYarn({ sync: true }))
      const highlighter = await createHighlighter({
        themes: ['github-light', 'github-dark'],
        langs: Object.keys(bundledLanguages),
      })
      md.use(magicMove, highlighter)
    },
    theme: {
      light: 'github-light',
      dark: 'github-dark',
    },
    codeTransformers: [
      {
        name: 'twoslash-replace-include',
        preprocess: (code, options) => {
          const include = parseIncludeMeta(options.meta?.__raw)
          if (include) addIncludes(includes, include, code)
          const codeWithIncludes = replaceIncludesInCode(includes, code)
          return codeWithIncludes
        },
      },
      transformerTwoslash(),
    ],
  },
  head: [
    [
      'meta',
      {
        name: 'viewport',
        content: 'width=device-width,initial-scale=1,user-scalable=no',
      },
    ],
    [
      'link',
      {
        rel: 'icon',
        href: '/assets/elysia.png',
      },
    ],
    [
      'meta',
      {
        property: 'og:image',
        content: 'https://elysiajs.com/assets/cover.jpg',
      },
    ],
    [
      'meta',
      {
        property: 'og:image:width',
        content: '1920',
      },
    ],
    [
      'meta',
      {
        property: 'og:image:height',
        content: '1080',
      },
    ],
    [
      'meta',
      {
        property: 'twitter:card',
        content: 'summary_large_image',
      },
    ],
    [
      'meta',
      {
        property: 'twitter:image',
        content: 'https://elysiajs.com/assets/cover.jpg',
      },
    ],
    [
      'meta',
      {
        property: 'og:title',
        content: 'ElysiaJS',
      },
    ],
    [
      'meta',
      {
        property: 'og:description',
        content: description,
      },
    ],
  ],
  themeConfig: {
    search: {
      provider: 'local',
    },
    logo: '/assets/elysia.svg',
    nav: [
      {
        text: 'Eden-Query',
        link: '/eden-query',
      },
    ],
    sidebar: [
      {
        text: 'Getting Started',
        items: [
          {
            text: 'Overview',
            link: '/overview',
          },
          {
            text: 'Quick Start',
            link: '/quick-start',
          },
          {
            text: 'Table of Contents',
            link: '/table-of-contents',
          },
        ],
      },
      {
        text: 'Eden-Query',
        collapsed: false,
        items: [
          {
            text: 'Overview',
            link: '/eden-query/index.md',
          },
          {
            text: 'Batching',
            link: '/eden-query/batching.md',
          },
          {
            text: 'Transformers',
            link: '/eden-query/transformers.md',
          },
          {
            text: 'Create Custom Header',
            link: '/eden-query/headers.md',
          },
          {
            text: 'CORS & Cookies',
            link: '/eden-query/cors.md',
          },
          {
            text: 'Links',
            link: '/eden-query/links/index.md',
            collapsed: true,
            items: [
              {
                text: 'HTTP Link',
                link: '/eden-query/links/http-link.md',
              },
              {
                text: 'HTTP Batch Link',
                link: '/eden-query/links/http-batch-link.md',
              },
              {
                text: 'Split Link',
                link: '/eden-query/links/split-link.md',
              },
              {
                text: 'Logger Link',
                link: '/eden-query/links/logger-link.md',
              },
            ],
          },
          {
            text: 'Eden-React-Query',
            collapsed: true,
            link: '/eden-query/react/index.md',
            items: [
              {
                text: 'Setup',
                link: '/eden-query/react/setup',
                docFooterText: 'Setup',
              },
              {
                text: 'Inferring Types',
                link: '/eden-query/react/inferring-types',
                docFooterText: 'Inferring Types',
              },
              {
                text: 'useQuery()',
                link: '/eden-query/react/useQuery',
                docFooterText: 'useQuery',
              },
              {
                text: 'useMutation()',
                link: '/eden-query/react/useMutation',
                docFooterText: 'useMutation',
              },
              {
                text: 'useInfiniteQuery()',
                link: '/eden-query/react/useInfiniteQuery',
                docFooterText: 'useInfiniteQuery',
              },
              {
                text: 'useUtils()',
                link: '/eden-query/react/useUtils',
                docFooterText: 'useUtils',
              },
              {
                text: 'createUtils()',
                link: '/eden-query/react/createUtils',
                docFooterText: 'createUtils',
              },
              {
                text: 'useQueries()',
                link: '/eden-query/react/useQueries',
                docFooterText: 'useQueries',
              },
              {
                text: 'Suspense',
                link: '/eden-query/react/suspense',
                docFooterText: 'Suspense',
              },
              {
                text: 'getQueryKey()',
                link: '/eden-query/react/getQueryKey',
                docFooterText: 'getQueryKey',
              },
              {
                text: 'Aborting Requests',
                link: '/eden-query/react/aborting',
                docFooterText: 'Aborting Requests',
              },
              {
                text: 'Disabling Queries',
                link: '/eden-query/react/disabling',
                docFooterText: 'Disabling Queries',
              },
            ],
          },
          {
            text: 'Eden-Svelte-Query',
            collapsed: true,
            link: '/eden-query/svelte/index.md',
            items: [
              {
                text: 'Setup',
                link: '/eden-query/svelte/setup',
                docFooterText: 'Setup',
              },
              {
                text: 'Inferring Types',
                link: '/eden-query/svelte/inferring-types',
                docFooterText: 'Inferring Types',
              },
              {
                text: 'createQuery()',
                link: '/eden-query/svelte/createQuery',
                docFooterText: 'createQuery',
              },
              {
                text: 'createMutation()',
                link: '/eden-query/svelte/createMutation',
                docFooterText: 'createMutation',
              },
              {
                text: 'createInfiniteQuery()',
                link: '/eden-query/svelte/createInfiniteQuery',
                docFooterText: 'createInfiniteQuery',
              },
              {
                text: 'useUtils()',
                link: '/eden-query/svelte/useUtils',
                docFooterText: 'useUtils',
              },
              {
                text: 'createUtils()',
                link: '/eden-query/svelte/createUtils',
                docFooterText: 'createUtils',
              },
              {
                text: 'createQueries()',
                link: '/eden-query/svelte/createQueries',
                docFooterText: 'createQueries',
              },
              {
                text: 'Reactive Queries',
                link: '/eden-query/svelte/reactive',
                docFooterText: 'Reactive Queries',
              },
              {
                text: 'getQueryKey()',
                link: '/eden-query/svelte/getQueryKey',
                docFooterText: 'getQueryKey',
              },
              {
                text: 'Aborting Requests',
                link: '/eden-query/svelte/aborting',
                docFooterText: 'Aborting Requests',
              },
              {
                text: 'Disabling Queries',
                link: '/eden-query/svelte/disabling',
                docFooterText: 'Disabling Queries',
              },
            ],
          },
        ],
      },
    ],
    socialLinks: [
      { icon: 'github', link: 'https://github.com/elysiajs/elysia' },
      { icon: 'twitter', link: 'https://twitter.com/elysiajs' },
      { icon: 'discord', link: 'https://discord.gg/eaFJ2KDJck' },
    ],
    editLink: {
      text: 'Edit this page on GitHub',
      pattern: 'https://github.com/ap0nia/eden-query/edit/main/documentation/docs/:path',
    },
  },
})
config.markdown?.shikiSetup
var config_default = config
export { config_default as default }
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiZG9jcy8udml0ZXByZXNzL2NvbmZpZy50cyIsICIuLi9wYWNrYWdlLmpzb24iLCAiZG9jcy8udml0ZXByZXNzL25wbS10by15YXJuLnRzIiwgImRvY3MvLnZpdGVwcmVzcy9tYWdpYy1tb3ZlLnRzIiwgImRvY3MvLnZpdGVwcmVzcy90d29zbGFzaC1pbmNsdWRlLnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiL2hvbWUvYXBvbmlhL1Byb2plY3RzL3R5cGVzY3JpcHQvaGkvY2xlYW4tZG9jcy9kb2NzLy52aXRlcHJlc3NcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIi9ob21lL2Fwb25pYS9Qcm9qZWN0cy90eXBlc2NyaXB0L2hpL2NsZWFuLWRvY3MvZG9jcy8udml0ZXByZXNzL2NvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vaG9tZS9hcG9uaWEvUHJvamVjdHMvdHlwZXNjcmlwdC9oaS9jbGVhbi1kb2NzL2RvY3MvLnZpdGVwcmVzcy9jb25maWcudHNcIjtpbXBvcnQgeyB0cmFuc2Zvcm1lclR3b3NsYXNoIH0gZnJvbSAnQHNoaWtpanMvdml0ZXByZXNzLXR3b3NsYXNoJ1xuaW1wb3J0IGNpIGZyb20gJ2NpLWluZm8nXG5pbXBvcnQgeyBidW5kbGVkTGFuZ3VhZ2VzLCBjcmVhdGVIaWdobGlnaHRlciB9IGZyb20gJ3NoaWtpJ1xuaW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZXByZXNzJ1xuaW1wb3J0IHsgcmVwb3NpdG9yeSB9IGZyb20gJy4uLy4uLy4uL3BhY2thZ2UuanNvbidcbmltcG9ydCB7IG5wbVRvWWFybiB9IGZyb20gJy4vbnBtLXRvLXlhcm4nXG5pbXBvcnQgeyBtYWdpY01vdmUgfSBmcm9tICcuL21hZ2ljLW1vdmUnXG5pbXBvcnQgeyBhZGRJbmNsdWRlcywgcGFyc2VJbmNsdWRlTWV0YSwgcmVwbGFjZUluY2x1ZGVzSW5Db2RlIH0gZnJvbSAnLi90d29zbGFzaC1pbmNsdWRlJ1xuXG5jb25zdCByZXBvc2l0b3J5TmFtZSA9IHJlcG9zaXRvcnkudXJsLnNwbGl0KCcvJykucG9wKCkgPz8gJydcblxuY29uc3QgZGVzY3JpcHRpb24gPVxuICAnRXJnb25vbWljIEZyYW1ld29yayBmb3IgSHVtYW5zLiBUeXBlU2NyaXB0IHNlcnZlciBmcmFtZXdvcmsgc3VwZXJjaGFyZ2VkIGJ5IEJ1biB3aXRoIEVuZC10by1FbmQgVHlwZSBTYWZldHksIHVuaWZpZWQgdHlwZSBzeXN0ZW0gYW5kIG91dHN0YW5kaW5nIGRldmVsb3BlciBleHBlcmllbmNlLidcblxuY29uc3QgaW5jbHVkZXMgPSBuZXcgTWFwPHN0cmluZywgc3RyaW5nPigpXG5cbmNvbnN0IGNvbmZpZyA9IGRlZmluZUNvbmZpZyh7XG4gIGxhbmc6ICdlbi1VUycsXG4gIHRpdGxlOiAnRWx5c2lhSlMnLFxuICBiYXNlOiBjaS5HSVRIVUJfQUNUSU9OUyA/IGAvJHtyZXBvc2l0b3J5TmFtZS5yZXBsYWNlKCcuZ2l0JywgJycpfS9gIDogJycsXG4gIGlnbm9yZURlYWRMaW5rczogdHJ1ZSxcbiAgbGFzdFVwZGF0ZWQ6IHRydWUsXG4gIG1hcmtkb3duOiB7XG4gICAgY29uZmlnOiBhc3luYyAobWQpID0+IHtcbiAgICAgIG1kLnVzZShucG1Ub1lhcm4oeyBzeW5jOiB0cnVlIH0pKVxuXG4gICAgICBjb25zdCBoaWdobGlnaHRlciA9IGF3YWl0IGNyZWF0ZUhpZ2hsaWdodGVyKHtcbiAgICAgICAgdGhlbWVzOiBbJ2dpdGh1Yi1saWdodCcsICdnaXRodWItZGFyayddLFxuICAgICAgICBsYW5nczogT2JqZWN0LmtleXMoYnVuZGxlZExhbmd1YWdlcyksXG4gICAgICB9KVxuXG4gICAgICBtZC51c2UobWFnaWNNb3ZlLCBoaWdobGlnaHRlcilcbiAgICB9LFxuICAgIHRoZW1lOiB7XG4gICAgICBsaWdodDogJ2dpdGh1Yi1saWdodCcsXG4gICAgICBkYXJrOiAnZ2l0aHViLWRhcmsnLFxuICAgIH0sXG4gICAgY29kZVRyYW5zZm9ybWVyczogW1xuICAgICAge1xuICAgICAgICBuYW1lOiAndHdvc2xhc2gtcmVwbGFjZS1pbmNsdWRlJyxcbiAgICAgICAgcHJlcHJvY2VzczogKGNvZGUsIG9wdGlvbnMpID0+IHtcbiAgICAgICAgICBjb25zdCBpbmNsdWRlID0gcGFyc2VJbmNsdWRlTWV0YShvcHRpb25zLm1ldGE/Ll9fcmF3KVxuXG4gICAgICAgICAgaWYgKGluY2x1ZGUpIGFkZEluY2x1ZGVzKGluY2x1ZGVzLCBpbmNsdWRlLCBjb2RlKVxuXG4gICAgICAgICAgY29uc3QgY29kZVdpdGhJbmNsdWRlcyA9IHJlcGxhY2VJbmNsdWRlc0luQ29kZShpbmNsdWRlcywgY29kZSlcblxuICAgICAgICAgIHJldHVybiBjb2RlV2l0aEluY2x1ZGVzXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgICAgdHJhbnNmb3JtZXJUd29zbGFzaCgpLFxuICAgIF0sXG4gIH0sXG4gIGhlYWQ6IFtcbiAgICBbXG4gICAgICAnbWV0YScsXG4gICAgICB7XG4gICAgICAgIG5hbWU6ICd2aWV3cG9ydCcsXG4gICAgICAgIGNvbnRlbnQ6ICd3aWR0aD1kZXZpY2Utd2lkdGgsaW5pdGlhbC1zY2FsZT0xLHVzZXItc2NhbGFibGU9bm8nLFxuICAgICAgfSxcbiAgICBdLFxuICAgIFtcbiAgICAgICdsaW5rJyxcbiAgICAgIHtcbiAgICAgICAgcmVsOiAnaWNvbicsXG4gICAgICAgIGhyZWY6ICcvYXNzZXRzL2VseXNpYS5wbmcnLFxuICAgICAgfSxcbiAgICBdLFxuICAgIFtcbiAgICAgICdtZXRhJyxcbiAgICAgIHtcbiAgICAgICAgcHJvcGVydHk6ICdvZzppbWFnZScsXG4gICAgICAgIGNvbnRlbnQ6ICdodHRwczovL2VseXNpYWpzLmNvbS9hc3NldHMvY292ZXIuanBnJyxcbiAgICAgIH0sXG4gICAgXSxcbiAgICBbXG4gICAgICAnbWV0YScsXG4gICAgICB7XG4gICAgICAgIHByb3BlcnR5OiAnb2c6aW1hZ2U6d2lkdGgnLFxuICAgICAgICBjb250ZW50OiAnMTkyMCcsXG4gICAgICB9LFxuICAgIF0sXG4gICAgW1xuICAgICAgJ21ldGEnLFxuICAgICAge1xuICAgICAgICBwcm9wZXJ0eTogJ29nOmltYWdlOmhlaWdodCcsXG4gICAgICAgIGNvbnRlbnQ6ICcxMDgwJyxcbiAgICAgIH0sXG4gICAgXSxcbiAgICBbXG4gICAgICAnbWV0YScsXG4gICAgICB7XG4gICAgICAgIHByb3BlcnR5OiAndHdpdHRlcjpjYXJkJyxcbiAgICAgICAgY29udGVudDogJ3N1bW1hcnlfbGFyZ2VfaW1hZ2UnLFxuICAgICAgfSxcbiAgICBdLFxuICAgIFtcbiAgICAgICdtZXRhJyxcbiAgICAgIHtcbiAgICAgICAgcHJvcGVydHk6ICd0d2l0dGVyOmltYWdlJyxcbiAgICAgICAgY29udGVudDogJ2h0dHBzOi8vZWx5c2lhanMuY29tL2Fzc2V0cy9jb3Zlci5qcGcnLFxuICAgICAgfSxcbiAgICBdLFxuICAgIFtcbiAgICAgICdtZXRhJyxcbiAgICAgIHtcbiAgICAgICAgcHJvcGVydHk6ICdvZzp0aXRsZScsXG4gICAgICAgIGNvbnRlbnQ6ICdFbHlzaWFKUycsXG4gICAgICB9LFxuICAgIF0sXG4gICAgW1xuICAgICAgJ21ldGEnLFxuICAgICAge1xuICAgICAgICBwcm9wZXJ0eTogJ29nOmRlc2NyaXB0aW9uJyxcbiAgICAgICAgY29udGVudDogZGVzY3JpcHRpb24sXG4gICAgICB9LFxuICAgIF0sXG4gIF0sXG4gIHRoZW1lQ29uZmlnOiB7XG4gICAgc2VhcmNoOiB7XG4gICAgICBwcm92aWRlcjogJ2xvY2FsJyxcbiAgICB9LFxuICAgIGxvZ286ICcvYXNzZXRzL2VseXNpYS5zdmcnLFxuICAgIG5hdjogW1xuICAgICAge1xuICAgICAgICB0ZXh0OiAnRWRlbi1RdWVyeScsXG4gICAgICAgIGxpbms6ICcvZWRlbi1xdWVyeScsXG4gICAgICB9LFxuICAgIF0sXG4gICAgc2lkZWJhcjogW1xuICAgICAge1xuICAgICAgICB0ZXh0OiAnR2V0dGluZyBTdGFydGVkJyxcbiAgICAgICAgaXRlbXM6IFtcbiAgICAgICAgICB7XG4gICAgICAgICAgICB0ZXh0OiAnT3ZlcnZpZXcnLFxuICAgICAgICAgICAgbGluazogJy9vdmVydmlldycsXG4gICAgICAgICAgfSxcbiAgICAgICAgICB7XG4gICAgICAgICAgICB0ZXh0OiAnUXVpY2sgU3RhcnQnLFxuICAgICAgICAgICAgbGluazogJy9xdWljay1zdGFydCcsXG4gICAgICAgICAgfSxcbiAgICAgICAgICB7XG4gICAgICAgICAgICB0ZXh0OiAnVGFibGUgb2YgQ29udGVudHMnLFxuICAgICAgICAgICAgbGluazogJy90YWJsZS1vZi1jb250ZW50cycsXG4gICAgICAgICAgfSxcbiAgICAgICAgXSxcbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIHRleHQ6ICdFZGVuLVF1ZXJ5JyxcbiAgICAgICAgY29sbGFwc2VkOiBmYWxzZSxcbiAgICAgICAgaXRlbXM6IFtcbiAgICAgICAgICB7XG4gICAgICAgICAgICB0ZXh0OiAnT3ZlcnZpZXcnLFxuICAgICAgICAgICAgbGluazogJy9lZGVuLXF1ZXJ5L2luZGV4Lm1kJyxcbiAgICAgICAgICB9LFxuICAgICAgICAgIHtcbiAgICAgICAgICAgIHRleHQ6ICdCYXRjaGluZycsXG4gICAgICAgICAgICBsaW5rOiAnL2VkZW4tcXVlcnkvYmF0Y2hpbmcubWQnLFxuICAgICAgICAgIH0sXG4gICAgICAgICAge1xuICAgICAgICAgICAgdGV4dDogJ1RyYW5zZm9ybWVycycsXG4gICAgICAgICAgICBsaW5rOiAnL2VkZW4tcXVlcnkvdHJhbnNmb3JtZXJzLm1kJyxcbiAgICAgICAgICB9LFxuICAgICAgICAgIHtcbiAgICAgICAgICAgIHRleHQ6ICdDcmVhdGUgQ3VzdG9tIEhlYWRlcicsXG4gICAgICAgICAgICBsaW5rOiAnL2VkZW4tcXVlcnkvaGVhZGVycy5tZCcsXG4gICAgICAgICAgfSxcbiAgICAgICAgICB7XG4gICAgICAgICAgICB0ZXh0OiAnQ09SUyAmIENvb2tpZXMnLFxuICAgICAgICAgICAgbGluazogJy9lZGVuLXF1ZXJ5L2NvcnMubWQnLFxuICAgICAgICAgIH0sXG4gICAgICAgICAge1xuICAgICAgICAgICAgdGV4dDogJ0xpbmtzJyxcbiAgICAgICAgICAgIGxpbms6ICcvZWRlbi1xdWVyeS9saW5rcy9pbmRleC5tZCcsXG4gICAgICAgICAgICBjb2xsYXBzZWQ6IHRydWUsXG4gICAgICAgICAgICBpdGVtczogW1xuICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgdGV4dDogJ0hUVFAgTGluaycsXG4gICAgICAgICAgICAgICAgbGluazogJy9lZGVuLXF1ZXJ5L2xpbmtzL2h0dHAtbGluay5tZCcsXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICB0ZXh0OiAnSFRUUCBCYXRjaCBMaW5rJyxcbiAgICAgICAgICAgICAgICBsaW5rOiAnL2VkZW4tcXVlcnkvbGlua3MvaHR0cC1iYXRjaC1saW5rLm1kJyxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHRleHQ6ICdTcGxpdCBMaW5rJyxcbiAgICAgICAgICAgICAgICBsaW5rOiAnL2VkZW4tcXVlcnkvbGlua3Mvc3BsaXQtbGluay5tZCcsXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICB0ZXh0OiAnTG9nZ2VyIExpbmsnLFxuICAgICAgICAgICAgICAgIGxpbms6ICcvZWRlbi1xdWVyeS9saW5rcy9sb2dnZXItbGluay5tZCcsXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBdLFxuICAgICAgICAgIH0sXG4gICAgICAgICAge1xuICAgICAgICAgICAgdGV4dDogJ0VkZW4tUmVhY3QtUXVlcnknLFxuICAgICAgICAgICAgY29sbGFwc2VkOiB0cnVlLFxuICAgICAgICAgICAgbGluazogJy9lZGVuLXF1ZXJ5L3JlYWN0L2luZGV4Lm1kJyxcbiAgICAgICAgICAgIGl0ZW1zOiBbXG4gICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICB0ZXh0OiAnU2V0dXAnLFxuICAgICAgICAgICAgICAgIGxpbms6ICcvZWRlbi1xdWVyeS9yZWFjdC9zZXR1cCcsXG4gICAgICAgICAgICAgICAgZG9jRm9vdGVyVGV4dDogJ1NldHVwJyxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHRleHQ6ICdJbmZlcnJpbmcgVHlwZXMnLFxuICAgICAgICAgICAgICAgIGxpbms6ICcvZWRlbi1xdWVyeS9yZWFjdC9pbmZlcnJpbmctdHlwZXMnLFxuICAgICAgICAgICAgICAgIGRvY0Zvb3RlclRleHQ6ICdJbmZlcnJpbmcgVHlwZXMnLFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgdGV4dDogJ3VzZVF1ZXJ5KCknLFxuICAgICAgICAgICAgICAgIGxpbms6ICcvZWRlbi1xdWVyeS9yZWFjdC91c2VRdWVyeScsXG4gICAgICAgICAgICAgICAgZG9jRm9vdGVyVGV4dDogJ3VzZVF1ZXJ5JyxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHRleHQ6ICd1c2VNdXRhdGlvbigpJyxcbiAgICAgICAgICAgICAgICBsaW5rOiAnL2VkZW4tcXVlcnkvcmVhY3QvdXNlTXV0YXRpb24nLFxuICAgICAgICAgICAgICAgIGRvY0Zvb3RlclRleHQ6ICd1c2VNdXRhdGlvbicsXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICB0ZXh0OiAndXNlSW5maW5pdGVRdWVyeSgpJyxcbiAgICAgICAgICAgICAgICBsaW5rOiAnL2VkZW4tcXVlcnkvcmVhY3QvdXNlSW5maW5pdGVRdWVyeScsXG4gICAgICAgICAgICAgICAgZG9jRm9vdGVyVGV4dDogJ3VzZUluZmluaXRlUXVlcnknLFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgdGV4dDogJ3VzZVV0aWxzKCknLFxuICAgICAgICAgICAgICAgIGxpbms6ICcvZWRlbi1xdWVyeS9yZWFjdC91c2VVdGlscycsXG4gICAgICAgICAgICAgICAgZG9jRm9vdGVyVGV4dDogJ3VzZVV0aWxzJyxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHRleHQ6ICdjcmVhdGVVdGlscygpJyxcbiAgICAgICAgICAgICAgICBsaW5rOiAnL2VkZW4tcXVlcnkvcmVhY3QvY3JlYXRlVXRpbHMnLFxuICAgICAgICAgICAgICAgIGRvY0Zvb3RlclRleHQ6ICdjcmVhdGVVdGlscycsXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICB0ZXh0OiAndXNlUXVlcmllcygpJyxcbiAgICAgICAgICAgICAgICBsaW5rOiAnL2VkZW4tcXVlcnkvcmVhY3QvdXNlUXVlcmllcycsXG4gICAgICAgICAgICAgICAgZG9jRm9vdGVyVGV4dDogJ3VzZVF1ZXJpZXMnLFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgdGV4dDogJ1N1c3BlbnNlJyxcbiAgICAgICAgICAgICAgICBsaW5rOiAnL2VkZW4tcXVlcnkvcmVhY3Qvc3VzcGVuc2UnLFxuICAgICAgICAgICAgICAgIGRvY0Zvb3RlclRleHQ6ICdTdXNwZW5zZScsXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICB0ZXh0OiAnZ2V0UXVlcnlLZXkoKScsXG4gICAgICAgICAgICAgICAgbGluazogJy9lZGVuLXF1ZXJ5L3JlYWN0L2dldFF1ZXJ5S2V5JyxcbiAgICAgICAgICAgICAgICBkb2NGb290ZXJUZXh0OiAnZ2V0UXVlcnlLZXknLFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgdGV4dDogJ0Fib3J0aW5nIFJlcXVlc3RzJyxcbiAgICAgICAgICAgICAgICBsaW5rOiAnL2VkZW4tcXVlcnkvcmVhY3QvYWJvcnRpbmcnLFxuICAgICAgICAgICAgICAgIGRvY0Zvb3RlclRleHQ6ICdBYm9ydGluZyBSZXF1ZXN0cycsXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICB0ZXh0OiAnRGlzYWJsaW5nIFF1ZXJpZXMnLFxuICAgICAgICAgICAgICAgIGxpbms6ICcvZWRlbi1xdWVyeS9yZWFjdC9kaXNhYmxpbmcnLFxuICAgICAgICAgICAgICAgIGRvY0Zvb3RlclRleHQ6ICdEaXNhYmxpbmcgUXVlcmllcycsXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBdLFxuICAgICAgICAgIH0sXG4gICAgICAgICAge1xuICAgICAgICAgICAgdGV4dDogJ0VkZW4tU3ZlbHRlLVF1ZXJ5JyxcbiAgICAgICAgICAgIGNvbGxhcHNlZDogdHJ1ZSxcbiAgICAgICAgICAgIGxpbms6ICcvZWRlbi1xdWVyeS9zdmVsdGUvaW5kZXgubWQnLFxuICAgICAgICAgICAgaXRlbXM6IFtcbiAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHRleHQ6ICdTZXR1cCcsXG4gICAgICAgICAgICAgICAgbGluazogJy9lZGVuLXF1ZXJ5L3N2ZWx0ZS9zZXR1cCcsXG4gICAgICAgICAgICAgICAgZG9jRm9vdGVyVGV4dDogJ1NldHVwJyxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHRleHQ6ICdJbmZlcnJpbmcgVHlwZXMnLFxuICAgICAgICAgICAgICAgIGxpbms6ICcvZWRlbi1xdWVyeS9zdmVsdGUvaW5mZXJyaW5nLXR5cGVzJyxcbiAgICAgICAgICAgICAgICBkb2NGb290ZXJUZXh0OiAnSW5mZXJyaW5nIFR5cGVzJyxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHRleHQ6ICdjcmVhdGVRdWVyeSgpJyxcbiAgICAgICAgICAgICAgICBsaW5rOiAnL2VkZW4tcXVlcnkvc3ZlbHRlL2NyZWF0ZVF1ZXJ5JyxcbiAgICAgICAgICAgICAgICBkb2NGb290ZXJUZXh0OiAnY3JlYXRlUXVlcnknLFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgdGV4dDogJ2NyZWF0ZU11dGF0aW9uKCknLFxuICAgICAgICAgICAgICAgIGxpbms6ICcvZWRlbi1xdWVyeS9zdmVsdGUvY3JlYXRlTXV0YXRpb24nLFxuICAgICAgICAgICAgICAgIGRvY0Zvb3RlclRleHQ6ICdjcmVhdGVNdXRhdGlvbicsXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICB0ZXh0OiAnY3JlYXRlSW5maW5pdGVRdWVyeSgpJyxcbiAgICAgICAgICAgICAgICBsaW5rOiAnL2VkZW4tcXVlcnkvc3ZlbHRlL2NyZWF0ZUluZmluaXRlUXVlcnknLFxuICAgICAgICAgICAgICAgIGRvY0Zvb3RlclRleHQ6ICdjcmVhdGVJbmZpbml0ZVF1ZXJ5JyxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHRleHQ6ICd1c2VVdGlscygpJyxcbiAgICAgICAgICAgICAgICBsaW5rOiAnL2VkZW4tcXVlcnkvc3ZlbHRlL3VzZVV0aWxzJyxcbiAgICAgICAgICAgICAgICBkb2NGb290ZXJUZXh0OiAndXNlVXRpbHMnLFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgdGV4dDogJ2NyZWF0ZVV0aWxzKCknLFxuICAgICAgICAgICAgICAgIGxpbms6ICcvZWRlbi1xdWVyeS9zdmVsdGUvY3JlYXRlVXRpbHMnLFxuICAgICAgICAgICAgICAgIGRvY0Zvb3RlclRleHQ6ICdjcmVhdGVVdGlscycsXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICB0ZXh0OiAnY3JlYXRlUXVlcmllcygpJyxcbiAgICAgICAgICAgICAgICBsaW5rOiAnL2VkZW4tcXVlcnkvc3ZlbHRlL2NyZWF0ZVF1ZXJpZXMnLFxuICAgICAgICAgICAgICAgIGRvY0Zvb3RlclRleHQ6ICdjcmVhdGVRdWVyaWVzJyxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHRleHQ6ICdSZWFjdGl2ZSBRdWVyaWVzJyxcbiAgICAgICAgICAgICAgICBsaW5rOiAnL2VkZW4tcXVlcnkvc3ZlbHRlL3JlYWN0aXZlJyxcbiAgICAgICAgICAgICAgICBkb2NGb290ZXJUZXh0OiAnUmVhY3RpdmUgUXVlcmllcycsXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICB0ZXh0OiAnZ2V0UXVlcnlLZXkoKScsXG4gICAgICAgICAgICAgICAgbGluazogJy9lZGVuLXF1ZXJ5L3N2ZWx0ZS9nZXRRdWVyeUtleScsXG4gICAgICAgICAgICAgICAgZG9jRm9vdGVyVGV4dDogJ2dldFF1ZXJ5S2V5JyxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHRleHQ6ICdBYm9ydGluZyBSZXF1ZXN0cycsXG4gICAgICAgICAgICAgICAgbGluazogJy9lZGVuLXF1ZXJ5L3N2ZWx0ZS9hYm9ydGluZycsXG4gICAgICAgICAgICAgICAgZG9jRm9vdGVyVGV4dDogJ0Fib3J0aW5nIFJlcXVlc3RzJyxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHRleHQ6ICdEaXNhYmxpbmcgUXVlcmllcycsXG4gICAgICAgICAgICAgICAgbGluazogJy9lZGVuLXF1ZXJ5L3N2ZWx0ZS9kaXNhYmxpbmcnLFxuICAgICAgICAgICAgICAgIGRvY0Zvb3RlclRleHQ6ICdEaXNhYmxpbmcgUXVlcmllcycsXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBdLFxuICAgICAgICAgIH0sXG4gICAgICAgIF0sXG4gICAgICB9LFxuICAgIF0sXG4gICAgc29jaWFsTGlua3M6IFtcbiAgICAgIHsgaWNvbjogJ2dpdGh1YicsIGxpbms6ICdodHRwczovL2dpdGh1Yi5jb20vZWx5c2lhanMvZWx5c2lhJyB9LFxuICAgICAgeyBpY29uOiAndHdpdHRlcicsIGxpbms6ICdodHRwczovL3R3aXR0ZXIuY29tL2VseXNpYWpzJyB9LFxuICAgICAgeyBpY29uOiAnZGlzY29yZCcsIGxpbms6ICdodHRwczovL2Rpc2NvcmQuZ2cvZWFGSjJLREpjaycgfSxcbiAgICBdLFxuICAgIGVkaXRMaW5rOiB7XG4gICAgICB0ZXh0OiAnRWRpdCB0aGlzIHBhZ2Ugb24gR2l0SHViJyxcbiAgICAgIHBhdHRlcm46ICdodHRwczovL2dpdGh1Yi5jb20vYXAwbmlhL2VkZW4tcXVlcnkvZWRpdC9tYWluL2RvY3VtZW50YXRpb24vZG9jcy86cGF0aCcsXG4gICAgfSxcbiAgfSxcbn0pXG5cbmNvbmZpZy5tYXJrZG93bj8uc2hpa2lTZXR1cFxuZXhwb3J0IGRlZmF1bHQgY29uZmlnXG4iLCAie1xuICBcIm5hbWVcIjogXCJlbHlzaWFqcy1lZGVuXCIsXG4gIFwidmVyc2lvblwiOiBcIjAuMC4wXCIsXG4gIFwiZGVzY3JpcHRpb25cIjogXCJtb25vcmVwbyBmb3IgZWRlbiwgYSBmdWxseSB0eXBlLXNhZmUgRWx5c2lhLmpzIGNsaWVudFwiLFxuICBcImNvbnRyaWJ1dG9yc1wiOiBbXG4gICAge1xuICAgICAgXCJuYW1lXCI6IFwiYXAwbmlhXCIsXG4gICAgICBcInVybFwiOiBcImh0dHBzOi8vZ2l0aHViLmNvbS9hcDBuaWFcIlxuICAgIH1cbiAgXSxcbiAgXCJyZXBvc2l0b3J5XCI6IHtcbiAgICBcInR5cGVcIjogXCJnaXRcIixcbiAgICBcInVybFwiOiBcImh0dHBzOi8vZ2l0aHViLmNvbS9hcDBuaWEvZWRlbi1xdWVyeVwiXG4gIH0sXG4gIFwiYnVnc1wiOiB7XG4gICAgXCJ1cmxcIjogXCJodHRwczovL2dpdGh1Yi5jb20vYXAwbmlhL2VkZW4tcXVlcnkvaXNzdWVzXCJcbiAgfSxcbiAgXCJrZXl3b3Jkc1wiOiBbXG4gICAgXCJlbHlzaWFcIixcbiAgICBcImVkZW5cIixcbiAgICBcImNvbm5lY3RvclwiLFxuICAgIFwidGFuc3RhY2stcXVlcnlcIlxuICBdLFxuICBcIndvcmtzcGFjZXNcIjogW1xuICAgIFwiZXhhbXBsZXMvKlwiLFxuICAgIFwicGFja2FnZXMvKlwiXG4gIF0sXG4gIFwidHlwZVwiOiBcIm1vZHVsZVwiLFxuICBcInNjcmlwdHNcIjoge1xuICAgIFwicG9zdGluc3RhbGxcIjogXCJjaGFuZ2VzZXQgaW5pdCAmJiBodXNreSBpbnN0YWxsXCIsXG4gICAgXCJidWlsZFwiOiBcIm54IHJ1bi1tYW55IC10IGJ1aWxkXCJcbiAgfSxcbiAgXCJkZXZEZXBlbmRlbmNpZXNcIjoge1xuICAgIFwiQGNoYW5nZXNldHMvY2xpXCI6IFwiXjIuMjcuN1wiLFxuICAgIFwiQGNvbW1pdGxpbnQvY29uZmlnLWNvbnZlbnRpb25hbFwiOiBcIl4xOS4yLjJcIixcbiAgICBcIkBjb21taXRsaW50L3R5cGVzXCI6IFwiXjE5LjAuM1wiLFxuICAgIFwiQGVzbGludC9qc1wiOiBcIl45LjguMFwiLFxuICAgIFwiQHR5cGVzL2VzbGludC1jb25maWctcHJldHRpZXJcIjogXCJeNi4xMS4zXCIsXG4gICAgXCJAdHlwZXMvZXNsaW50X19qc1wiOiBcIl44LjQyLjNcIixcbiAgICBcIkB0eXBlcy9saW50LXN0YWdlZFwiOiBcIl4xMy4zLjBcIixcbiAgICBcIkB0eXBlc2NyaXB0LWVzbGludC9lc2xpbnQtcGx1Z2luXCI6IFwiXjcuMTguMFwiLFxuICAgIFwiQHR5cGVzY3JpcHQtZXNsaW50L3BhcnNlclwiOiBcIl43LjE4LjBcIixcbiAgICBcImNvbW1pdGl6ZW5cIjogXCJeNC4zLjBcIixcbiAgICBcImNvbW1pdGxpbnRcIjogXCJeMTkuMy4wXCIsXG4gICAgXCJjei1jb252ZW50aW9uYWwtY2hhbmdlbG9nXCI6IFwiXjMuMy4wXCIsXG4gICAgXCJkZXZtb2ppXCI6IFwiXjIuMy4wXCIsXG4gICAgXCJlc2xpbnQtY29uZmlnLXByZXR0aWVyXCI6IFwiXjkuMS4wXCIsXG4gICAgXCJlc2xpbnQtcGx1Z2luLXNpbXBsZS1pbXBvcnQtc29ydFwiOiBcIl4xMi4xLjFcIixcbiAgICBcImVzbGludC1wbHVnaW4tc3ZlbHRlXCI6IFwiXjIuNDMuMFwiLFxuICAgIFwiZ2xvYmFsc1wiOiBcIl4xNS44LjBcIixcbiAgICBcImh1c2t5XCI6IFwiXjkuMS40XCIsXG4gICAgXCJsaW50LXN0YWdlZFwiOiBcIl4xNS4yLjdcIixcbiAgICBcIm54XCI6IFwiXjE5LjUuN1wiLFxuICAgIFwicHJldHRpZXJcIjogXCJeMy4zLjNcIixcbiAgICBcInN2ZWx0ZVwiOiBcIl40LjIuMThcIixcbiAgICBcInN2ZWx0ZS1lc2xpbnQtcGFyc2VyXCI6IFwiXjAuNDEuMFwiLFxuICAgIFwidHlwZXNjcmlwdFwiOiBcIl41LjUuNFwiLFxuICAgIFwidHlwZXNjcmlwdC1lc2xpbnRcIjogXCJeNy4xOC4wXCJcbiAgfSxcbiAgXCJwYWNrYWdlTWFuYWdlclwiOiBcInBucG1AOS4xLjFcIixcbiAgXCJlbmdpbmVzXCI6IHtcbiAgICBcInBucG1cIjogXCJeOS4wLjBcIixcbiAgICBcIm5vZGVcIjogXCI+PTE4XCJcbiAgfVxufVxuIiwgImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvaG9tZS9hcG9uaWEvUHJvamVjdHMvdHlwZXNjcmlwdC9oaS9jbGVhbi1kb2NzL2RvY3MvLnZpdGVwcmVzc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiL2hvbWUvYXBvbmlhL1Byb2plY3RzL3R5cGVzY3JpcHQvaGkvY2xlYW4tZG9jcy9kb2NzLy52aXRlcHJlc3MvbnBtLXRvLXlhcm4udHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL2hvbWUvYXBvbmlhL1Byb2plY3RzL3R5cGVzY3JpcHQvaGkvY2xlYW4tZG9jcy9kb2NzLy52aXRlcHJlc3MvbnBtLXRvLXlhcm4udHNcIjtpbXBvcnQgY29udmVydCBmcm9tICducG0tdG8teWFybidcbmltcG9ydCB7IG5hbm9pZCB9IGZyb20gJ25hbm9pZCdcbmltcG9ydCB0eXBlIHsgTWFya2Rvd25SZW5kZXJlciB9IGZyb20gJ3ZpdGVwcmVzcydcblxuZXhwb3J0IGNvbnN0IFBBQ0tBR0VfTUFOQUdFUlM6IFBhY2thZ2VNYW5hZ2VyW10gPSBbJ25wbScsICdwbnBtJywgJ3lhcm4nLCAnYnVuJ11cblxuZXhwb3J0IHR5cGUgUGFja2FnZU1hbmFnZXIgPSBQYXJhbWV0ZXJzPHR5cGVvZiBjb252ZXJ0PlsxXVxuXG4vKipcbiAqIFRoZSBrZXkgYWZ0ZXIgdGhlIGxhbmd1YWdlIG9mIHRoZSBjb2RlIGJsb2NrIHRoYXQncyB1c2VkIHRvIGFjdGl2YXRlIHRoaXMgcGx1Z2luLlxuICpcbiAqIEBleGFtcGxlXG4gKlxuICogYGBgc2gge05QTV9UT19ZQVJOX0tFWX1cbiAqIGBgYFxuICovXG5leHBvcnQgY29uc3QgTlBNX1RPX1lBUk5fS0VZID0gJ25wbTJ5YXJuJ1xuXG5mdW5jdGlvbiBleHRyYWN0UGFja2FnZU1hbmFnZXIoY29udGVudDogc3RyaW5nKTogUGFja2FnZU1hbmFnZXIge1xuICBjb25zdCB0cmltbWVkQ29udGVudCA9IGNvbnRlbnQudHJpbSgpXG5cbiAgaWYgKHRyaW1tZWRDb250ZW50LmluY2x1ZGVzKCd5YXJuJykpIHtcbiAgICByZXR1cm4gJ3lhcm4nXG4gIH1cblxuICBpZiAodHJpbW1lZENvbnRlbnQuaW5jbHVkZXMoJ3BucG0nKSkge1xuICAgIHJldHVybiAncG5wbSdcbiAgfVxuXG4gIGlmICh0cmltbWVkQ29udGVudC5pbmNsdWRlcygnYnVuJykpIHtcbiAgICByZXR1cm4gJ2J1bidcbiAgfVxuXG4gIHJldHVybiAnbnBtJ1xufVxuXG4vKipcbiAqIEtub3duIGNvbnZlcnRlcnMgYXJlIGluZGljYXRlZCBieSB0aGVpciBuYW1lLiBpLmUuIHRoZSBhY3R1YWwgbmFtZSBvZiB0aGUgcGFja2FnZSBtYW5hZ2VyLlxuICovXG50eXBlIEtub3duQ29udmVydGVyID0gUGFja2FnZU1hbmFnZXJcblxuLyoqXG4gKiBDdXN0b20gY29udmVydGVycyBjYW4gYmUgcHJvdmlkZWQgdGhhdCB0cmFuc2xhdGUgYW4gTlBNIGNvbW1hbmQuXG4gKi9cbnR5cGUgQ3VzdG9tQ29udmVydGVyID0gW25hbWU6IHN0cmluZywgY2I6IChucG1Db21tYW5kOiBzdHJpbmcpID0+IHN0cmluZ11cblxuLyoqXG4gKi9cbnR5cGUgQ29udmVydGVyID0gQ3VzdG9tQ29udmVydGVyIHwgS25vd25Db252ZXJ0ZXJcblxuZnVuY3Rpb24gY3JlYXRlQ29kZUdyb3VwTGFiZWwoaWQ6IHN0cmluZywgY2hlY2tlZDogYm9vbGVhbiwgZ3JvdXA6IHN0cmluZywgdGl0bGU6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiBbXG4gICAgYDxpbnB1dCB0eXBlPVwicmFkaW9cIiBuYW1lPVwiZ3JvdXAtJHtncm91cH1cIiBpZD1cInRhYi0ke2lkfVwiICR7Y2hlY2tlZCA/ICdjaGVja2VkJyA6ICcnfT5gLFxuICAgIGAgIDxsYWJlbCBmb3I9XCJ0YWItJHtpZH1cIj4ke3RpdGxlfWAsXG4gICAgYDwvbGFiZWw+YCxcbiAgXS5qb2luKCdcXG4nKVxufVxuXG5leHBvcnQgdHlwZSBOcG1Ub1lhcm5PcHRpb25zID0ge1xuICAvKipcbiAgICogV2hldGhlciB0byBzeW5jP1xuICAgKi9cbiAgc3luYz86IGJvb2xlYW5cblxuICAvKipcbiAgICogQWxsIGNvbnZlcnRlcnMuXG4gICAqXG4gICAqIEBkZWZhdWx0IHtAbGluayBQQUNLQUdFX01BTkFHRVJTfVxuICAgKi9cbiAgY29udmVydGVycz86IENvbnZlcnRlcltdXG59XG5cbi8qKlxuICogR29vZCByZWZlcmVuY2UgZm9yIG5wbTJ5YXJuIGFuZCB0YWIgc3luY2luZzpcbiAqIEBzZWUgaHR0cHM6Ly9naXRodWIuY29tL3NhcHBoaS1yZWQvdml0ZXByZXNzLXBsdWdpbnNcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG5wbVRvWWFybihvcHRpb25zPzogTnBtVG9ZYXJuT3B0aW9ucykge1xuICAvKipcbiAgICogSWYgYWxsIHRoZSB0YWJzIHNob3VsZCBiZSBzeW5jZWQsIHRoZW4gZXN0YWJsaXNoIGEgZ2xvYmFsIGdyb3VwIElELlxuICAgKiBMZWF2ZSBpdCB1bmRlZmluZWQgYW5kIG1ha2UgYSBuZXcgZ3JvdXAgZm9yIGVhY2ggYG5wbTJ5YXJuYCBpbnN0YW5jZSBvdGhlcndpc2UuXG4gICAqXG4gICAqIEB0b2RvIFN5bmNocm9uaXphdGlvbi4gRG9jdXNhdXJ1cyB1c2VzIGxvY2Fsc3RvcmFnZS4uLlxuICAgKi9cbiAgLy8gY29uc3Qgc3luY2VkR3JvdXAgPSBvcHRpb25zPy5zeW5jID8gbmFub2lkKDcpIDogdW5kZWZpbmVkXG5cbiAgY29uc3QgcGx1Z2luID0gKG1kOiBNYXJrZG93blJlbmRlcmVyKSA9PiB7XG4gICAgY29uc3QgZmVuY2UgPSBtZC5yZW5kZXJlci5ydWxlcy5mZW5jZVxuXG4gICAgbWQucmVuZGVyZXIucnVsZXMuZmVuY2UgPSAoLi4uYXJncykgPT4ge1xuICAgICAgY29uc3QgW3Rva2VucywgaWR4LCAuLi5yZXN0XSA9IGFyZ3NcblxuICAgICAgY29uc3QgY3VycmVudFRva2VuID0gdG9rZW5zW2lkeF1cblxuICAgICAgLy8gSWdub3JlIHRoaXMgY29kZSBibG9jayBiZWNhdXNlIGl0J3MgbWlzc2luZyB0aGUga2V5LlxuXG4gICAgICBpZiAoY3VycmVudFRva2VuID09IG51bGwgfHwgIWN1cnJlbnRUb2tlbi5pbmZvLmluY2x1ZGVzKE5QTV9UT19ZQVJOX0tFWSkpIHtcbiAgICAgICAgcmV0dXJuIGZlbmNlPy4odG9rZW5zLCBpZHgsIC4uLnJlc3QpID8/ICcnXG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGNvbnZlcnRlcnMgPSBvcHRpb25zPy5jb252ZXJ0ZXJzID8/IFBBQ0tBR0VfTUFOQUdFUlNcblxuICAgICAgLyoqXG4gICAgICAgKiBJZiBhbGwgdGFicyBzaG91bGQgYmUgc3luY2VkLCB0aGVuIHVzZSBhIHNoYXJlZCBncm91cCwgb3RoZXJ3aXNlIGNyZWF0ZSBhIG5ldyBvbmUuXG4gICAgICAgKi9cbiAgICAgIGNvbnN0IGdyb3VwID0gbmFub2lkKDcpXG5cbiAgICAgIGNvbnN0IGNvZGVHcm91cExhYmVscyA9IGNvbnZlcnRlcnNcbiAgICAgICAgLm1hcCgoY29udmVydGVyLCBpbmRleCkgPT4ge1xuICAgICAgICAgIGNvbnN0IGlkID0gbmFub2lkKDUpXG4gICAgICAgICAgY29uc3QgY2hlY2tlZCA9IGluZGV4ID09PSAwXG4gICAgICAgICAgY29uc3QgdGl0bGUgPSB0eXBlb2YgY29udmVydGVyID09PSAnc3RyaW5nJyA/IGNvbnZlcnRlciA6IGNvbnZlcnRlclswXVxuICAgICAgICAgIHJldHVybiBjcmVhdGVDb2RlR3JvdXBMYWJlbChpZCwgY2hlY2tlZCwgZ3JvdXAsIHRpdGxlKVxuICAgICAgICB9KVxuICAgICAgICAuam9pbignXFxuJylcblxuICAgICAgY29uc3QgY3VycmVudFBhY2thZ2VNYW5hZ2VyID0gZXh0cmFjdFBhY2thZ2VNYW5hZ2VyKGN1cnJlbnRUb2tlbi5jb250ZW50KVxuXG4gICAgICAvKipcbiAgICAgICAqIEVuc3VyZSB0aGF0IHRoZSBjb21tYW5kIGlzIHRyYW5zbGF0ZWQgaW4gTlBNLlxuICAgICAgICovXG4gICAgICBjb25zdCBucG1Db21tYW5kID1cbiAgICAgICAgY3VycmVudFBhY2thZ2VNYW5hZ2VyID09PSAnbnBtJ1xuICAgICAgICAgID8gY3VycmVudFRva2VuLmNvbnRlbnRcbiAgICAgICAgICA6IGNvbnZlcnQoY3VycmVudFRva2VuLmNvbnRlbnQsICducG0nKVxuXG4gICAgICBjb25zdCBjb2RlR3JvdXBCbG9ja3MgPSBjb252ZXJ0ZXJzXG4gICAgICAgIC5tYXAoKGNvbnZlcnRlcikgPT4ge1xuICAgICAgICAgIGNvbnN0IHRyYW5zbGF0ZWRDb21tYW5kID1cbiAgICAgICAgICAgIHR5cGVvZiBjb252ZXJ0ZXIgPT09ICdzdHJpbmcnXG4gICAgICAgICAgICAgID8gY29udmVydChucG1Db21tYW5kLCBjb252ZXJ0ZXIpXG4gICAgICAgICAgICAgIDogY29udmVydGVyWzFdKG5wbUNvbW1hbmQpXG4gICAgICAgICAgY3VycmVudFRva2VuLmNvbnRlbnQgPSB0cmFuc2xhdGVkQ29tbWFuZFxuICAgICAgICAgIGNvbnN0IG1hcmt1cCA9IGZlbmNlPy4odG9rZW5zLCBpZHgsIC4uLnJlc3QpID8/ICcnXG4gICAgICAgICAgcmV0dXJuIG1hcmt1cFxuICAgICAgICB9KVxuICAgICAgICAuam9pbignXFxuJylcblxuICAgICAgcmV0dXJuIFtcbiAgICAgICAgYDxkaXYgY2xhc3M9XCJ2cC1jb2RlLWdyb3VwIHZwLWFkYXB0aXZlLXRoZW1lXCI+YCxcbiAgICAgICAgYCAgPGRpdiBjbGFzcz1cInRhYnNcIj4ke2NvZGVHcm91cExhYmVsc308L2Rpdj5gLFxuICAgICAgICBgICA8ZGl2IGNsYXNzPVwiYmxvY2tzXCI+JHtjb2RlR3JvdXBCbG9ja3N9PC9kaXY+YCxcbiAgICAgICAgYDwvZGl2PmAsXG4gICAgICBdLmpvaW4oJ1xcbicpXG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHBsdWdpblxufVxuIiwgImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvaG9tZS9hcG9uaWEvUHJvamVjdHMvdHlwZXNjcmlwdC9oaS9jbGVhbi1kb2NzL2RvY3MvLnZpdGVwcmVzc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiL2hvbWUvYXBvbmlhL1Byb2plY3RzL3R5cGVzY3JpcHQvaGkvY2xlYW4tZG9jcy9kb2NzLy52aXRlcHJlc3MvbWFnaWMtbW92ZS50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vaG9tZS9hcG9uaWEvUHJvamVjdHMvdHlwZXNjcmlwdC9oaS9jbGVhbi1kb2NzL2RvY3MvLnZpdGVwcmVzcy9tYWdpYy1tb3ZlLnRzXCI7aW1wb3J0IHR5cGUgeyBIaWdobGlnaHRlciB9IGZyb20gJ3NoaWtpJ1xuaW1wb3J0IHsgY29kZVRvS2V5ZWRUb2tlbnMgfSBmcm9tICdzaGlraS1tYWdpYy1tb3ZlL2NvcmUnXG5pbXBvcnQgeyBNYXJrZG93blJlbmRlcmVyIH0gZnJvbSAndml0ZXByZXNzJ1xuaW1wb3J0IHR5cGUgeyBQbHVnaW5PcHRpb24gfSBmcm9tICd2aXRlJ1xuXG5jb25zdCBNQUdJQ19NT1ZFX0JMT0NLX1JFR0VYID0gL146OjptYWdpYy1tb3ZlKD86WyBdKihcXHsuKj9cXH0pPyhbXlxcbl0qPykpP1xcbihbXFxzXFxTXSs/KV46OjokL2dtXG5cbmNvbnN0IENPREVfQkxPQ0tfUkVHRVggPVxuICAvXmBgYChbXFx3Jy1dKz8pKD86XFxzKlxcWyhbXlxcXV0qKVxcXSk/KD86XFxzKnsoW1xcZFxcdyosXFx8LV0rKX1cXHMqPyh7Lio/fSk/KC4qPykpP1xcbihbXFxzXFxTXSs/KV5gYGAkL2dtXG5cbmV4cG9ydCBmdW5jdGlvbiBub3JtYWxpemVSYW5nZVN0cihyYW5nZVN0ciA9ICcnKSB7XG4gIHJldHVybiAhcmFuZ2VTdHIudHJpbSgpXG4gICAgPyBbXVxuICAgIDogcmFuZ2VTdHJcbiAgICAgIC50cmltKClcbiAgICAgIC5zcGxpdCgvXFx8L2cpXG4gICAgICAubWFwKChpKSA9PiBpLnRyaW0oKSlcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIG1hZ2ljTW92ZShtZDogTWFya2Rvd25SZW5kZXJlciwgc2hpa2k6IEhpZ2hsaWdodGVyKSB7XG4gIG1kLmJsb2NrLnJ1bGVyLmJlZm9yZSgnZmVuY2UnLCAnbWFnaWMtbW92ZScsIChzdGF0ZSwgc3RhcnRMaW5lLCBfZW5kTGluZSwgX3NpbGVudCkgPT4ge1xuICAgIGNvbnN0IHN0YXJ0ID0gc3RhdGUuYk1hcmtzW3N0YXJ0TGluZV0gKyBzdGF0ZS50U2hpZnRbc3RhcnRMaW5lXVxuXG4gICAgY29uc3QgbWF4ID0gc3RhdGUuZU1hcmtzW3N0YXJ0TGluZV1cblxuICAgIGlmIChzdGF0ZS5zcmMuc2xpY2Uoc3RhcnQsIG1heCkuc3RhcnRzV2l0aCgnOjo6bWFnaWMtbW92ZScpKSB7XG4gICAgICBjb25zdCBbY29udGFpbmVyQmxvY2sgPSAnJ10gPSBzdGF0ZS5zcmMuc2xpY2Uoc3RhcnQpLm1hdGNoKE1BR0lDX01PVkVfQkxPQ0tfUkVHRVgpIHx8IFtdXG5cbiAgICAgIGNvbnN0IG1hdGNoZXMgPSBBcnJheS5mcm9tKGNvbnRhaW5lckJsb2NrLm1hdGNoQWxsKENPREVfQkxPQ0tfUkVHRVgpKVxuXG4gICAgICBpZiAoIW1hdGNoZXMubGVuZ3RoKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignTWFnaWMgTW92ZSBibG9jayBtdXN0IGNvbnRhaW4gYXQgbGVhc3Qgb25lIGNvZGUgYmxvY2snKVxuICAgICAgfVxuXG4gICAgICBjb25zdCByYW5nZXMgPSBtYXRjaGVzLm1hcCgoaSkgPT4gbm9ybWFsaXplUmFuZ2VTdHIoaVszXSkpXG5cbiAgICAgIGNvbnN0IHN0ZXBzID0gbWF0Y2hlcy5tYXAoKGkpID0+IHtcbiAgICAgICAgY29uc3QgY29kZSA9IGlbNl0udHJpbUVuZCgpXG5cbiAgICAgICAgY29uc3Qgb3B0aW9ucyA9IHtcbiAgICAgICAgICBsYW5nOiBpWzFdIGFzIGFueSxcbiAgICAgICAgICB0aGVtZXM6IHtcbiAgICAgICAgICAgIGxpZ2h0OiAnZ2l0aHViLWxpZ2h0JyxcbiAgICAgICAgICAgIGRhcms6ICdnaXRodWItZGFyaycsXG4gICAgICAgICAgfSxcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGtleWVkVG9rZW5JbmZvID0gY29kZVRvS2V5ZWRUb2tlbnMoc2hpa2ksIGNvZGUsIG9wdGlvbnMpXG5cbiAgICAgICAgY29uc3QgZmlsZU5hbWUgPSBpWzJdIHx8IGlbMV1cblxuICAgICAgICByZXR1cm4geyAuLi5rZXllZFRva2VuSW5mbywgZmlsZU5hbWUgfVxuICAgICAgfSlcblxuICAgICAgY29uc3QgdG9rZW4gPSBzdGF0ZS5wdXNoKCdtYWdpYy1tb3ZlX29wZW4nLCAnZGl2JywgMSlcblxuICAgICAgdG9rZW4ubWV0YSA9IHtcbiAgICAgICAgc3RlcHNMejogZW5jb2RlVVJJQ29tcG9uZW50KEpTT04uc3RyaW5naWZ5KHN0ZXBzKSksXG4gICAgICAgIHN0ZXBSYW5nZXM6IEpTT04uc3RyaW5naWZ5KHJhbmdlcyksXG4gICAgICB9XG5cbiAgICAgIHN0YXRlLnB1c2goJ21hZ2ljLW1vdmVfY2xvc2UnLCAnZGl2JywgLTEpXG4gICAgICBzdGF0ZS5saW5lID0gc3RhcnRMaW5lICsgY29udGFpbmVyQmxvY2suc3BsaXQoJ1xcbicpLmxlbmd0aFxuXG4gICAgICByZXR1cm4gdHJ1ZVxuICAgIH1cblxuICAgIHJldHVybiBmYWxzZVxuICB9KVxuXG4gIGZ1bmN0aW9uIHJlbmRlckRlZmF1bHQodG9rZW5zOiBhbnlbXSwgaWR4OiBudW1iZXIpIHtcbiAgICBpZiAodG9rZW5zW2lkeF0ubmVzdGluZyA9PT0gMSkge1xuICAgICAgY29uc3QgeyBzdGVwc0x6LCBzdGVwUmFuZ2VzIH0gPSB0b2tlbnNbaWR4XS5tZXRhXG4gICAgICByZXR1cm4gYDxNYWdpY01vdmUgc3RlcHMtbHo9XCIke3N0ZXBzTHp9XCIgOnN0ZXAtcmFuZ2VzPVwiJHtzdGVwUmFuZ2VzfVwiIC8+YFxuICAgIH1cblxuICAgIHJldHVybiAnJ1xuICB9XG5cbiAgbWQucmVuZGVyZXIucnVsZXNbJ21hZ2ljLW1vdmVfb3BlbiddID0gcmVuZGVyRGVmYXVsdFxuICBtZC5yZW5kZXJlci5ydWxlc1snbWFnaWMtbW92ZV9jbG9zZSddID0gcmVuZGVyRGVmYXVsdFxufVxuXG5leHBvcnQgZnVuY3Rpb24gTWFnaWNNb3ZlUGx1Z2luKCk6IFBsdWdpbk9wdGlvbiB7XG4gIHJldHVybiB7XG4gICAgbmFtZTogJ3ZpdGUtcGx1Z2luLW1hZ2ljLW1vdmUnLFxuXG4gICAgZW5mb3JjZTogJ3Bvc3QnLFxuXG4gICAgdHJhbnNmb3JtKHNyYywgaWQpIHtcbiAgICAgIGlmIChpZC5pbmNsdWRlcygndml0ZXByZXNzL2Rpc3QvY2xpZW50L2FwcC9pbmRleC5qcycpKSB7XG4gICAgICAgIHNyYyA9IGBcXG5pbXBvcnQgTWFnaWNNb3ZlIGZyb20gJ3ZpdGVwcmVzcy1wbHVnaW4tbWFnaWMtbW92ZS9NYWdpY01vdmUudnVlJztcXG4ke3NyY31gXG5cbiAgICAgICAgY29uc3QgbGluZXMgPSBzcmMuc3BsaXQoJ1xcbicpXG5cbiAgICAgICAgY29uc3QgdGFyZ2V0TGluZUluZGV4ID0gbGluZXMuZmluZEluZGV4KChsaW5lKSA9PiBsaW5lLmluY2x1ZGVzKCdhcHAuY29tcG9uZW50JykpXG5cbiAgICAgICAgbGluZXMuc3BsaWNlKHRhcmdldExpbmVJbmRleCwgMCwgJyAgYXBwLmNvbXBvbmVudChcIk1hZ2ljTW92ZVwiLCBNYWdpY01vdmUpOycpXG5cbiAgICAgICAgc3JjID0gbGluZXMuam9pbignXFxuJylcblxuICAgICAgICByZXR1cm4geyBjb2RlOiBzcmMsIG1hcDogbnVsbCB9XG4gICAgICB9XG4gICAgfSxcbiAgfVxufVxuIiwgImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvaG9tZS9hcG9uaWEvUHJvamVjdHMvdHlwZXNjcmlwdC9oaS9jbGVhbi1kb2NzL2RvY3MvLnZpdGVwcmVzc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiL2hvbWUvYXBvbmlhL1Byb2plY3RzL3R5cGVzY3JpcHQvaGkvY2xlYW4tZG9jcy9kb2NzLy52aXRlcHJlc3MvdHdvc2xhc2gtaW5jbHVkZS50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vaG9tZS9hcG9uaWEvUHJvamVjdHMvdHlwZXNjcmlwdC9oaS9jbGVhbi1kb2NzL2RvY3MvLnZpdGVwcmVzcy90d29zbGFzaC1pbmNsdWRlLnRzXCI7ZXhwb3J0IGZ1bmN0aW9uIGFkZEluY2x1ZGVzKG1hcDogTWFwPHN0cmluZywgc3RyaW5nPiwgbmFtZTogc3RyaW5nLCBjb2RlOiBzdHJpbmcpIHtcbiAgY29uc3QgbGluZXM6IHN0cmluZ1tdID0gW11cblxuICBjb2RlLnNwbGl0KCdcXG4nKS5mb3JFYWNoKChsLCBfaSkgPT4ge1xuICAgIGNvbnN0IHRyaW1tZWQgPSBsLnRyaW0oKVxuXG4gICAgaWYgKHRyaW1tZWQuc3RhcnRzV2l0aCgnLy8gLSAnKSkge1xuICAgICAgY29uc3Qga2V5ID0gdHJpbW1lZC5zcGxpdCgnLy8gLSAnKVsxXS5zcGxpdCgnICcpWzBdXG4gICAgICBtYXAuc2V0KGAke25hbWV9LSR7a2V5fWAsIGxpbmVzLmpvaW4oJ1xcbicpKVxuICAgIH0gZWxzZSB7XG4gICAgICBsaW5lcy5wdXNoKGwpXG4gICAgfVxuICB9KVxuICBtYXAuc2V0KG5hbWUsIGxpbmVzLmpvaW4oJ1xcbicpKVxufVxuXG5leHBvcnQgZnVuY3Rpb24gcmVwbGFjZUluY2x1ZGVzSW5Db2RlKF9tYXA6IE1hcDxzdHJpbmcsIHN0cmluZz4sIGNvZGU6IHN0cmluZykge1xuICBjb25zdCBpbmNsdWRlcyA9IC9cXC9cXC8gQGluY2x1ZGU6ICguKikkL2dtXG5cbiAgLy8gQmFzaWNhbGx5IHJ1biBhIHJlZ2V4IG92ZXIgdGhlIGNvZGUgcmVwbGFjaW5nIGFueSAvLyBAaW5jbHVkZTogdGhpbmcgd2l0aFxuICAvLyAndGhpbmcnIGZyb20gdGhlIG1hcFxuXG4gIC8vIGNvbnN0IHRvUmVwbGFjZTogW2luZGV4Om51bWJlciwgbGVuZ3RoOiBudW1iZXIsIHN0cjogc3RyaW5nXVtdID0gW11cbiAgY29uc3QgdG9SZXBsYWNlOiBbbnVtYmVyLCBudW1iZXIsIHN0cmluZ11bXSA9IFtdXG5cbiAgbGV0IG1hdGNoXG4gIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1jb25kLWFzc2lnblxuICB3aGlsZSAoKG1hdGNoID0gaW5jbHVkZXMuZXhlYyhjb2RlKSkgIT09IG51bGwpIHtcbiAgICAvLyBUaGlzIGlzIG5lY2Vzc2FyeSB0byBhdm9pZCBpbmZpbml0ZSBsb29wcyB3aXRoIHplcm8td2lkdGggbWF0Y2hlc1xuICAgIGlmIChtYXRjaC5pbmRleCA9PT0gaW5jbHVkZXMubGFzdEluZGV4KSB7XG4gICAgICBpbmNsdWRlcy5sYXN0SW5kZXgrK1xuICAgIH1cbiAgICBjb25zdCBrZXkgPSBtYXRjaFsxXVxuICAgIGNvbnN0IHJlcGxhY2VXaXRoID0gX21hcC5nZXQoa2V5KVxuXG4gICAgaWYgKCFyZXBsYWNlV2l0aCkge1xuICAgICAgY29uc3QgbXNnID0gYENvdWxkIG5vdCBmaW5kIGFuIGluY2x1ZGUgd2l0aCB0aGUga2V5OiAnJHtrZXl9Jy5cXG5UaGVyZSBpczogJHtBcnJheS5mcm9tKF9tYXAua2V5cygpKX0uYFxuICAgICAgY29uc29sZS5lcnJvcihtc2cpXG4gICAgfSBlbHNlIHtcbiAgICAgIHRvUmVwbGFjZS5wdXNoKFttYXRjaC5pbmRleCwgbWF0Y2hbMF0ubGVuZ3RoLCByZXBsYWNlV2l0aF0pXG4gICAgfVxuICB9XG5cbiAgbGV0IG5ld0NvZGUgPSBjb2RlLnRvU3RyaW5nKClcbiAgLy8gR28gYmFja3dhcmRzIHRocm91Z2ggdGhlIGZvdW5kIGNoYW5nZXMgc28gdGhhdCB3ZSBjYW4gcmV0YWluIGluZGV4IHBvc2l0aW9uXG4gIHRvUmVwbGFjZS5yZXZlcnNlKCkuZm9yRWFjaCgocikgPT4ge1xuICAgIG5ld0NvZGUgPSBuZXdDb2RlLnN1YnN0cmluZygwLCByWzBdKSArIHJbMl0gKyBuZXdDb2RlLnN1YnN0cmluZyhyWzBdICsgclsxXSlcbiAgfSlcbiAgcmV0dXJuIG5ld0NvZGVcbn1cblxuLyoqXG4gKiBAZXhhbXBsZVxuICpcbiAqICd0eXBlc2NyaXB0IHR3b3NsYXNoIGluY2x1ZGUgbWFpbiBtZXRhPW1pc2NlbGxhbmVvdXMnXG4gKlxuICogV2Ugd2FudCB0byBjYXB0dXJlIHRoZSBcIm1haW5cIiwgc2luY2UgdGhhdCdzIHRoZSBuYW1lIG9mIHRoaXMgcmV1c2FibGUgYmxvY2suXG4gKiBJZ25vcmUgYW55dGhpbmcgYmVmb3JlIGFuZCBhZnRlciB0aGlzIHNlZ21lbnQuXG4gKlxuICogVGhlIG5hbWUgc2hvdWxkIGJlIGNhcHR1cmVkIGluIHRoZSBmaXJzdCBjYXB0dXJpbmcgZ3JvdXAsIGkuZS4gbWF0Y2hbMV0uXG4gKi9cbmNvbnN0IElOQ0xVREVfTUVUQV9SRUdFWCA9IC9pbmNsdWRlXFxzKyhbXFx3LV0rKVxcYi4qPy9cblxuLyoqXG4gKiBHaXZlbiB0aGUgcmF3IG1ldGEsIHRyeSB0byBwYXJzZSB0aGUgaW5jbHVkZSBuYW1lLlxuICovXG5leHBvcnQgZnVuY3Rpb24gcGFyc2VJbmNsdWRlTWV0YShtZXRhPzogc3RyaW5nKTogc3RyaW5nIHwgbnVsbCB7XG4gIGlmICghbWV0YSkgcmV0dXJuIG51bGxcblxuICBjb25zdCBtYXRjaCA9IG1ldGEubWF0Y2goSU5DTFVERV9NRVRBX1JFR0VYKVxuXG4gIHJldHVybiBtYXRjaD8uWzFdID8/IG51bGxcbn1cbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBa1csU0FBUywyQkFBMkI7QUFDdFksT0FBTyxRQUFRO0FBQ2YsU0FBUyxrQkFBa0IseUJBQXlCO0FBQ3BELFNBQVMsb0JBQW9COzs7QUNPM0IsaUJBQWM7QUFBQSxFQUNaLE1BQVE7QUFBQSxFQUNSLEtBQU87QUFDVDs7O0FDYjBXLE9BQU8sYUFBYTtBQUNoWSxTQUFTLGNBQWM7QUFHaEIsSUFBTSxtQkFBcUMsQ0FBQyxPQUFPLFFBQVEsUUFBUSxLQUFLO0FBWXhFLElBQU0sa0JBQWtCO0FBRS9CLFNBQVMsc0JBQXNCLFNBQWlDO0FBQzlELFFBQU0saUJBQWlCLFFBQVEsS0FBSztBQUVw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QUEsUUFDVixTQUFTO0FBQUEsTUFDWDtBQUFBLElBQ0Y7QUFBQSxJQUNBO0FBQUEsTUFDRTtBQUFBLE1BQ0E7QUFBQSxRQUNFLFVBQVU7QUFBQSxRQUNWLFNBQVM7QUFBQSxNQUNYO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFBQSxFQUNBLGFBQWE7QUFBQSxJQUNYLFFBQVE7QUFBQSxNQUNOLFVBQVU7QUFBQSxJQUNaO0FBQUEsSUFDQSxNQUFNO0FBQUEsSUFDTixLQUFLO0FBQUEsTUFDSDtBQUFBLFFBQ0UsTUFBTTtBQUFBLFFBQ04sTUFBTTtBQUFBLE1BQ1I7QUFBQSxJQUNGO0FBQUEsSUFDQSxTQUFTO0FBQUEsTUFDUDtBQUFBLFFBQ0UsTUFBTTtBQUFBLFFBQ04sT0FBTztBQUFBLFVBQ0w7QUFBQSxZQUNFLE1BQU07QUFBQSxZQUNOLE1BQU07QUFBQSxVQUNSO0FBQUEsVUFDQTtBQUFBLFlBQ0UsTUFBTTtBQUFBLFlBQ04sTUFBTTtBQUFBLFVBQ1I7QUFBQSxVQUNBO0FBQUEsWUFDRSxNQUFNO0FBQUEsWUFDTixNQUFNO0FBQUEsVUFDUjtBQUFBLFFBQ0Y7QUFBQSxNQUNGO0FBQUEsTUFDQTtBQUFBLFFBQ0UsTUFBTTtBQUFBLFFBQ04sV0FBVztBQUFBLFFBQ1gsT0FBTztBQUFBLFVBQ0w7QUFBQSxZQUNFLE1BQU07QUFBQSxZQUNOLE1BQU07QUFBQSxVQUNSO0FBQUEsVUFDQTtBQUFBLFlBQ0UsTUFBTTtBQUFBLFlBQ04sTUFBTTtBQUFBLFVBQ1I7QUFBQSxVQUNBO0FBQUEsWUFDRSxNQUFNO0FBQUEsWUFDTixNQUFNO0FBQUEsVUFDUjtBQUFBLFVBQ0E7QUFBQSxZQUNFLE1BQU07QUFBQSxZQUNOLE1BQU07QUFBQSxVQUNSO0FBQUEsVUFDQTtBQUFBLFlBQ0UsTUFBTTtBQUFBLFlBQ04sTUFBTTtBQUFBLFVBQ1I7QUFBQSxVQUNBO0FBQUEsWUFDRSxNQUFNO0FBQUEsWUFDTixNQUFNO0FBQUEsWUFDTixXQUFXO0FBQUEsWUFDWCxPQUFPO0FBQUEsY0FDTDtBQUFBLGdCQUNFLE1BQU07QUFBQSxnQkFDTixNQUFNO0FBQUEsY0FDUjtBQUFBLGNBQ0E7QUFBQSxnQkFDRSxNQUFNO0FBQUEsZ0JBQ04sTUFBTTtBQUFBLGNBQ1I7QUFBQSxjQUNBO0FBQUEsZ0JBQ0UsTUFBTTtBQUFBLGdCQUNOLE1BQU07QUFBQSxjQUNSO0FBQUEsY0FDQTtBQUFBLGdCQUNFLE1BQU07QUFBQSxnQkFDTixNQUFNO0FBQUEsY0FDUjtBQUFBLFlBQ0Y7QUFBQSxVQUNGO0FBQUEsVUFDQTtBQUFBLFlBQ0UsTUFBTTtBQUFBLFlBQ04sV0FBVztBQUFBLFlBQ1gsTUFBTTtBQUFBLFlBQ04sT0FBTztBQUFBLGNBQ0w7QUFBQSxnQkFDRSxNQUFNO0FBQUEsZ0JBQ04sTUFBTTtBQUFBLGdCQUNOLGVBQWU7QUFBQSxjQUNqQjtBQUFBLGNBQ0E7QUFBQSxnQkFDRSxNQUFNO0FBQUEsZ0JBQ04sTUFBTTtBQUFBLGdCQUNOLGVBQWU7QUFBQSxjQUNqQjtBQUFBLGNBQ0E7QUFBQSxnQkFDRSxNQUFNO0FBQUEsZ0JBQ04sTUFBTTtBQUFBLGdCQUNOLGVBQWU7QUFBQSxjQUNqQjtBQUFBLGNBQ0E7QUFBQSxnQkFDRSxNQUFNO0FBQUEsZ0JBQ04sTUFBTTtBQUFBLGdCQUNOLGVBQWU7QUFBQSxjQUNqQjtBQUFBLGNBQ0E7QUFBQSxnQkFDRSxNQUFNO0FBQUEsZ0JBQ04sTUFBTTtBQUFBLGdCQUNOLGVBQWU7QUFBQSxjQUNqQjtBQUFBLGNBQ0E7QUFBQSxnQkFDRSxNQUFNO0FBQUEsZ0JBQ04sTUFBTTtBQUFBLGdCQUNOLGVBQWU7QUFBQSxjQUNqQjtBQUFBLGNBQ0E7QUFBQSxnQkFDRSxNQUFNO0FBQUEsZ0JBQ04sTUFBTTtBQUFBLGdCQUNOLGVBQWU7QUFBQSxjQUNqQjtBQUFBLGNBQ0E7QUFBQSxnQkFDRSxNQUFNO0FBQUEsZ0JBQ04sTUFBTTtBQUFBLGdCQUNOLGVBQWU7QUFBQSxjQUNqQjtBQUFBLGNBQ0E7QUFBQSxnQkFDRSxNQUFNO0FBQUEsZ0JBQ04sTUFBTTtBQUFBLGdCQUNOLGVBQWU7QUFBQSxjQUNqQjtBQUFBLGNBQ0E7QUFBQSxnQkFDRSxNQUFNO0FBQUEsZ0JBQ04sTUFBTTtBQUFBLGdCQUNOLGVBQWU7QUFBQSxjQUNqQjtBQUFBLGNBQ0E7QUFBQSxnQkFDRSxNQUFNO0FBQUEsZ0JBQ04sTUFBTTtBQUFBLGdCQUNOLGVBQWU7QUFBQSxjQUNqQjtBQUFBLGNBQ0E7QUFBQSxnQkFDRSxNQUFNO0FBQUEsZ0JBQ04sTUFBTTtBQUFBLGdCQUNOLGVBQWU7QUFBQSxjQUNqQjtBQUFBLFlBQ0Y7QUFBQSxVQUNGO0FBQUEsVUFDQTtBQUFBLFlBQ0UsTUFBTTtBQUFBLFlBQ04sV0FBVztBQUFBLFlBQ1gsTUFBTTtBQUFBLFlBQ04sT0FBTztBQUFBLGNBQ0w7QUFBQSxnQkFDRSxNQUFNO0FBQUEsZ0JBQ04sTUFBTTtBQUFBLGdCQUNOLGVBQWU7QUFBQSxjQUNqQjtBQUFBLGNBQ0E7QUFBQSxnQkFDRSxNQUFNO0FBQUEsZ0JBQ04sTUFBTTtBQUFBLGdCQUNOLGVBQWU7QUFBQSxjQUNqQjtBQUFBLGNBQ0E7QUFBQSxnQkFDRSxNQUFNO0FBQUEsZ0JBQ04sTUFBTTtBQUFBLGdCQUNOLGVBQWU7QUFBQSxjQUNqQjtBQUFBLGNBQ0E7QUFBQSxnQkFDRSxNQUFNO0FBQUEsZ0JBQ04sTUFBTTtBQUFBLGdCQUNOLGVBQWU7QUFBQSxjQUNqQjtBQUFBLGNBQ0E7QUFBQSxnQkFDRSxNQUFNO0FBQUEsZ0JBQ04sTUFBTTtBQUFBLGdCQUNOLGVBQWU7QUFBQSxjQUNqQjtBQUFBLGNBQ0E7QUFBQSxnQkFDRSxNQUFNO0FBQUEsZ0JBQ04sTUFBTTtBQUFBLGdCQUNOLGVBQWU7QUFBQSxjQUNqQjtBQUFBLGNBQ0E7QUFBQSxnQkFDRSxNQUFNO0FBQUEsZ0JBQ04sTUFBTTtBQUFBLGdCQUNOLGVBQWU7QUFBQSxjQUNqQjtBQUFBLGNBQ0E7QUFBQSxnQkFDRSxNQUFNO0FBQUEsZ0JBQ04sTUFBTTtBQUFBLGdCQUNOLGVBQWU7QUFBQSxjQUNqQjtBQUFBLGNBQ0E7QUFBQSxnQkFDRSxNQUFNO0FBQUEsZ0JBQ04sTUFBTTtBQUFBLGdCQUNOLGVBQWU7QUFBQSxjQUNqQjtBQUFBLGNBQ0E7QUFBQSxnQkFDRSxNQUFNO0FBQUEsZ0JBQ04sTUFBTTtBQUFBLGdCQUNOLGVBQWU7QUFBQSxjQUNqQjtBQUFBLGNBQ0E7QUFBQSxnQkFDRSxNQUFNO0FBQUEsZ0JBQ04sTUFBTTtBQUFBLGdCQUNOLGVBQWU7QUFBQSxjQUNqQjtBQUFBLGNBQ0E7QUFBQSxnQkFDRSxNQUFNO0FBQUEsZ0JBQ04sTUFBTTtBQUFBLGdCQUNOLGVBQWU7QUFBQSxjQUNqQjtBQUFBLFlBQ0Y7QUFBQSxVQUNGO0FBQUEsUUFDRjtBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBQUEsSUFDQSxhQUFhO0FBQUEsTUFDWCxFQUFFLE1BQU0sVUFBVSxNQUFNLHFDQUFxQztBQUFBLE1BQzdELEVBQUUsTUFBTSxXQUFXLE1BQU0sK0JBQStCO0FBQUEsTUFDeEQsRUFBRSxNQUFNLFdBQVcsTUFBTSxnQ0FBZ0M7QUFBQSxJQUMzRDtBQUFBLElBQ0EsVUFBVTtBQUFBLE1BQ1IsTUFBTTtBQUFBLE1BQ04sU0FBUztBQUFBLElBQ1g7QUFBQSxFQUNGO0FBQ0YsQ0FBQztBQUVELE9BQU8sVUFBVTtBQUNqQixJQUFPLGlCQUFROyIsCiAgIm5hbWVzIjogWyJpbmNsdWRlcyJdCn0K

import { transformerTwoslash } from '@shikijs/vitepress-twoslash'
import ci from 'ci-info'
import { defineConfig } from 'vitepress'
import { repository } from '../../../package.json'
import { npmToYarn } from './vitepress-plugin-npm-to-yarn'
import { addIncludes, parseIncludeMeta, replaceIncludesInCode } from './twoslash-include'

const repositoryName = repository.url.split('/').pop() ?? ''

const description =
  'Ergonomic Framework for Humans. TypeScript framework supercharged by Bun with End - to - End Type Safety, unified type system and outstanding developer experience'

const includes = new Map<string, string>()

const config = defineConfig({
  lang: 'en-US',
  title: 'ElysiaJS',
  base: ci.GITHUB_ACTIONS ? `/${repositoryName.replace('.git', '')}/` : '',
  ignoreDeadLinks: true,
  lastUpdated: true,
  buildConcurrency: 32,
  markdown: {
    config: async (md) => {
      md.use(npmToYarn({ sync: true }))
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
  // ![INFO] uncomment for support hot reload on WSL - https://github.com/vitejs/vite/issues/1153#issuecomment-785467271
  vite: {
    server: {
      watch: {
        usePolling: true,
      },
    },
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
            text: 'At Glance',
            link: '/at-glance',
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
        link: '/eden-query/index.md',
        items: [
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

export default config

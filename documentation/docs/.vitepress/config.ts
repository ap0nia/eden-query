import { transformerTwoslash } from '@shikijs/vitepress-twoslash'
import ci from 'ci-info'
import { defineConfig } from 'vitepress'
import { repository } from '../../../package.json'
import { npmToYarn } from './vitepress-plugin-npm-to-yarn'

const repositoryName = repository.url.split('/').pop() ?? ''

const description =
  'Ergonomic Framework for Humans. TypeScript framework supercharged by Bun with End - to - End Type Safety, unified type system and outstanding developer experience'

const config = defineConfig({
  lang: 'en-US',
  title: 'ElysiaJS',
  base: ci.GITHUB_ACTIONS ? `/${repositoryName.replace('.git', '')}/` : '',
  ignoreDeadLinks: true,
  lastUpdated: true,
  markdown: {
    config: async (md) => {
      md.use(npmToYarn({ sync: true }))
    },
    theme: {
      light: 'github-light',
      dark: 'github-dark',
    },
    codeTransformers: [transformerTwoslash()],
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
        text: 'Eden',
        link: '/eden/overview',
      },
      {
        text: 'Eden-Query',
        link: '/eden-query/overview',
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
        text: 'Eden',
        collapsed: true,
        items: [
          {
            text: 'Overview',
            link: '/eden/overview.md',
            docFooterText: 'Eden Overview',
          },
          {
            text: 'Installation',
            link: '/eden/installation.md',
          },
          {
            text: 'Eden Treaty',
            collapsed: false,
            items: [
              {
                text: 'Overview',
                link: '/eden/treaty/overview',
                docFooterText: 'Eden Treaty Overview',
              },
              {
                text: 'Parameters',
                link: '/eden/treaty/parameters',
              },
              {
                text: 'Response',
                link: '/eden/treaty/response',
              },
              {
                text: 'Web Socket',
                link: '/eden/treaty/websocket',
              },
              {
                text: 'Config',
                link: '/eden/treaty/config',
              },
              {
                text: 'Unit Test',
                link: '/eden/treaty/unit-test',
              },
              {
                text: 'Legacy (Treaty 1)',
                link: '/eden/treaty/legacy.md',
              },
            ],
          },
          {
            text: 'Eden Fetch',
            link: '/eden/fetch.md',
            docFooterText: 'Eden Fetch Overview',
          },
        ],
      },
      {
        text: 'Eden-Query',
        collapsed: false,
        items: [
          {
            text: 'Overview',
            link: '/eden-query/overview.md',
            docFooterText: 'Eden Query Overview',
          },
          {
            text: 'Links',
            link: '/eden-query/links/index.md',
            collapsed: false,
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
            text: 'Transformers',
            link: '/eden-query/transformers.md',
          },
          {
            text: 'Batching',
            link: '/eden-query/batching.md',
          },
          {
            text: 'Eden-React-Query',
            collapsed: false,
            items: [
              {
                text: 'Overview',
                link: '/eden-query/react/overview',
                docFooterText: 'Eden React-Query Overview',
              },
            ],
          },
          {
            text: 'Eden-Svelte-Query',
            collapsed: false,
            items: [
              {
                text: 'Overview',
                link: '/eden-query/svelte/overview',
                docFooterText: 'Eden Svelte-Query Overview',
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

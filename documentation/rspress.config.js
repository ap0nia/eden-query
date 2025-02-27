// @ts-check

import path from 'node:path'

import ci from 'ci-info'
import { defineConfig } from 'rspress/config'
import { ModuleResolutionKind } from 'typescript'

import { rspressPluginTwoslash } from '@ap0nia/rspress-plugin-twoslash'
import { createFileSystemTypesCache } from '@ap0nia/rspress-plugin-twoslash/cache-fs'
import { pluginShiki } from '@rspress/plugin-shiki'

import { repository } from '../package.json'

const repositoryName = repository.url.split('/').pop() ?? ''

const base = ci.GITHUB_ACTIONS ? `/${repositoryName.replace('.git', '')}/` : ''

const description =
  'Ergonomic Framework for Humans. TypeScript framework supercharged by Bun with End - to - End Type Safety, unified type system and outstanding developer experience'

const config = defineConfig({
  lang: 'en-US',
  title: 'Elysia.js',
  icon: '/assets/elysia.png',
  logo: '/assets/elysia.svg',
  logoText: 'Elysia.js',
  search: {
    mode: 'local',
  },
  base,
  root: 'docs',
  outDir: 'build',
  globalStyles: path.join(__dirname, 'styles/index.css'),
  plugins: [
    rspressPluginTwoslash({
      typesCache: createFileSystemTypesCache({ dir: '.twoslash' }),
      twoslashOptions: {
        compilerOptions: {
          moduleResolution: ModuleResolutionKind.Bundler,
        },
        customTags: ['annotate', 'log', 'warn', 'error'],
      },
    }),
    pluginShiki(),
  ],
  builderConfig: {
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
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
    lastUpdated: true,
    sidebar: {
      '/': [
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
      ],
      '/eden-query/': [
        {
          text: 'Eden-Query',
          collapsed: false,
          items: [
            {
              text: 'Overview',
              link: '/eden-query/index',
            },
            {
              text: 'Batching',
              link: '/eden-query/batching',
            },
            {
              text: 'Transformers',
              link: '/eden-query/transformers',
            },
            {
              text: 'Create Custom Header',
              link: '/eden-query/headers',
            },
            {
              text: 'CORS & Cookies',
              link: '/eden-query/cors',
            },
            {
              text: 'Links',
              link: '/eden-query/links/index',
              collapsed: true,
              items: [
                {
                  text: 'HTTP Link',
                  link: '/eden-query/links/http-link',
                },
                {
                  text: 'HTTP Batch Link',
                  link: '/eden-query/links/http-batch-link',
                },
                {
                  text: 'Split Link',
                  link: '/eden-query/links/split-link',
                },
                {
                  text: 'Logger Link',
                  link: '/eden-query/links/logger-link',
                },
              ],
            },
            {
              text: 'Eden-React-Query',
              collapsed: true,
              link: '/eden-query/react/index',
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
              link: '/eden-query/svelte/index',
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
                  text: 'getUtils()',
                  link: '/eden-query/svelte/getUtils',
                  docFooterText: 'getUtils',
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
    },
    socialLinks: [
      { icon: 'github', mode: 'link', content: 'https://github.com/ap0nia/eden-query' },
      { icon: 'X', mode: 'link', content: 'https://twitter.com/elysiajs' },
      { icon: 'discord', mode: 'link', content: 'https://discord.gg/eaFJ2KDJck' },
    ],
    nav: [
      {
        text: 'Eden-Query',
        link: '/eden-query',
      },
      // {
      //   text: 'Cheat Sheet',
      //   link: '/integrations/cheat-sheet',
      // },
      // {
      //   text: 'Plugins',
      //   link: '/plugins/overview',
      // },
      // {
      //   text: 'Blog',
      //   link: '/blog',
      // },
    ],
  },
})

export default config

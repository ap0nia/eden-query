// https://vitepress.dev/guide/custom-theme

import DefaultTheme from 'vitepress/theme'

import Layout from './layout.vue'

import TwoslashFloatingVue from '@shikijs/vitepress-twoslash/client'
import '@shikijs/vitepress-twoslash/style.css'

import './custom.css'

import type { EnhanceAppContext } from 'vitepress'
import type { Theme } from 'vitepress'

const theme: Theme = {
  extends: DefaultTheme,
  Layout,
  enhanceApp({ app }: EnhanceAppContext) {
    app.use(TwoslashFloatingVue)
  },
}

export default theme

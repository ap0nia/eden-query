// @ts-check

import animate from 'tailwindcss-animate'
import daisyui from 'daisyui'

import { addDynamicIconSelectors } from '@iconify/tailwind'

/**
 * @type {import('tailwindcss').Config}
 */
const config = {
  content: ['docs/**/*.md', 'docs/**/*.mdx', 'src/**/*.ts', 'src/**/*.tsx', 'theme/**/*.tsx'],

  darkMode: 'class',

  plugins: [animate, daisyui, addDynamicIconSelectors()],

  /**
   * @type {import('daisyui').Config}
   */
  daisyui: {
    themes: [
      {
        light: {
          primary: '#ff94c2',
          // secondary: '',
          // accent: '',
          'base-100': '#FFFFFF',
        },
        dark: {
          primary: '#ba2d65',
          // secondary: '',
          // accent: '',
          'base-100': '#0f172a',
        },
      },
    ],
  },
}

export default config

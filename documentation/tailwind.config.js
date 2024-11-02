// @ts-check

import daisyui from 'daisyui'

/**
 * @type {import('tailwindcss').Config}
 */
const config = {
  content: [
    'src/**/*.vue',
    'docs/**/*.md',
    'src/**/*.svelte',
    'src/**/*.ts',
    'docs/.vitepress/theme/*.vue',
  ],

  darkMode: 'class',

  plugins: [daisyui],

  /**
   * @type {import('daisyui').Config}
   */
  daisyui: {
    themes: [
      {
        elysia: {
          primary: 'rgb(59 130 246)',
          secondary: 'rgb(192 132 252)',
          accent: 'rgb(240, 98, 146)',
        },
      },
    ],
  },
}

export default config

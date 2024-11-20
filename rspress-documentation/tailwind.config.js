// @ts-check

import daisyui from 'daisyui'

/**
 * @type {import('tailwindcss').Config}
 */
const config = {
  content: ['docs/**/*.md', 'docs/**/*.mdx', 'src/**/*.ts', 'src/**/*.tsx'],

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

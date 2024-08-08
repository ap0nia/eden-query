// @ts-check

import daisyui from 'daisyui'

/**
 * @type {import('tailwindcss').Config}
 */
const config = {
  preflight: false,
  content: ['components/**/*.vue', 'docs/**/*.md', 'docs/.vitepress/theme/*.vue'],
  darkMode: 'class',
  theme: {
    extend: {},
  },
  plugins: [daisyui],
}

export default config

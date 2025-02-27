// @ts-check

import tailwindcss from 'tailwindcss'
import postcssNesting from 'postcss-nesting'
import tailwindcssNesting from '@tailwindcss/nesting'
import autoprefixer from 'autoprefixer'

/**
 * @type {import('postcss-load-config').Config}
 */
const config = {
  plugins: [tailwindcss(), postcssNesting(), tailwindcssNesting(), autoprefixer()],
}

export default config

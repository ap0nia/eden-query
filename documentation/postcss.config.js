// @ts-check

import postcssImport from 'postcss-import'
import nesting from '@tailwindcss/nesting'
import tailwindcss from 'tailwindcss'
import autoprefixer from 'autoprefixer'

/**
 * @type {import('postcss-load-config').Config}
 */
const config = {
  plugins: [postcssImport(), nesting(), tailwindcss(), autoprefixer()],
}

export default config

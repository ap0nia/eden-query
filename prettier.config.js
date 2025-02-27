// @ts-check
import * as tailwind from 'prettier-plugin-tailwindcss'

/**
 * @type{import('prettier').Config}
 */
const config = {
  semi: false,
  printWidth: 100,
  singleQuote: true,
  plugins: [tailwind],
}

export default config

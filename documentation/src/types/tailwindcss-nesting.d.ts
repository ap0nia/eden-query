declare module '@tailwindcss/nesting' {
  import type { PluginCreator } from 'postcss'
  import type { pluginOptions } from 'postcss-nesting'

  declare const creator: PluginCreator<pluginOptions>

  export default creator
}

declare module '@tailwindcss/nesting' {
  import type { ConfigPlugin } from 'postcss-load-config'

  const plugin: ConfigPlugin

  export default () => plugin
}

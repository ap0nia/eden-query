/**
 * Allow importing vue components into TypeScript files.
 * @see https://stackoverflow.com/questions/42002394/importing-vue-components-in-typescript-file
 */
declare module '*.vue' {
  import { DefineComponent } from 'vue'

  const component: DefineComponent<{}, {}, any>

  export default component
}

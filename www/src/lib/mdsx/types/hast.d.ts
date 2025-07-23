declare global {
  declare module 'hast' {
    /**
     * Allow adding raw tokens that are not lowered.
     * This can be used for injecting raw Svelte templating directives like Snippets.
     */
    export interface Raw extends Literal {
      type: 'raw'
      value: string
    }
  }
}

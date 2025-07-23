declare global {
  declare module 'vfile' {
    interface DataMap {
      /**
       * Languages found.
       */
      langs?: Set<string>
    }
  }
}

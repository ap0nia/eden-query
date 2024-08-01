// @ts-check
import { defineConfig } from 'tsup'

const config = defineConfig({
  entry: ['src/index.ts'],
  bundle: true,
  format: ['esm'],

  /**
   * @see https://github.com/egoist/tsup/issues/619#issuecomment-1420423401
   */
  noExternal: [/(.*)/],
})

export default config

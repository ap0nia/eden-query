import { defineConfig } from 'tsup'

const config = defineConfig({
  entry: ['./src/index.ts'],
  outDir: 'dist',
  dts: true,
  format: ['esm'],
  noExternal: [/.*/],
})

export default config

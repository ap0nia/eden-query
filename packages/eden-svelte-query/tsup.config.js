import { defineConfig } from 'tsup'

const config = defineConfig({
  entry: {
    index: './src/index.ts',
    server: './src/server.ts',
  },
  clean: true,
  dts: true,
  sourcemap: true,
  format: ['esm', 'cjs'],
  noExternal: ['@ap0nia'],
})

export default config

import { defineConfig } from 'tsup'

const config = defineConfig({
  entry: ['./src/index.ts'],
  outDir: 'dist',
  dts: true,
  format: ['esm'],
  external: ['react'],
  noExternal: ['@ap0nia/eden-react-query', '@ap0nia/eden'],
  clean: true,
})

export default config

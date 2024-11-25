import { defineConfig } from 'tsup'

const config = defineConfig({
  entry: {
    index: './src/index.ts',
    client: './src/client.ts',
    config: './src/config.ts',
    constants: './src/constants.ts',
    errors: './src/errors.ts',
    http: './src/http.ts',
    infer: './src/infer.ts',
    request: './src/request.ts',
    resolve: './src/resolve.ts',
    server: './src/server.ts',
    treaty: './src/treaty.ts',
    ws: './src/ws.ts',
  },
  clean: true,
  dts: true,
  sourcemap: true,
  format: ['esm', 'cjs'],
})

export default config

// @ts-check

import { defineConfig } from 'vitest/config'

const config = defineConfig({
  test: {
    setupFiles: ['./tests/setup.ts'],
  },
})

export default config

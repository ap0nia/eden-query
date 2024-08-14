// @ts-check
import { b as build } from './node_modules/vitepress/dist/node/serve-f1iMCw7A.js'

const root = 'docs'

const argv = { _: ['build', 'docs'], root: 'docs' }

async function main() {
  await build(root, argv)
}

main()

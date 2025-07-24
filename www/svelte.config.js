// @ts-check

import path from 'node:path'
import url from 'node:url'

import rehypeAutolinkHeadings from 'rehype-autolink-headings'
import rehypeSlug from 'rehype-slug'
import ts from 'typescript'

import shikiRehype from '@shikijs/rehype'
import { transformerTwoslash } from '@shikijs/twoslash'

import { mdsxPreprocess } from './src/lib/mdsx/index.js'
import { rendererFloatingSvelte } from './src/lib/mdsx/floating-renderer-svelte.js'
import { createTwoslasher } from './src/lib/mdsx/twoslash-svelte.js'
import { parseMetaString } from './src/lib/unified/parse-meta.js'
// import { remarkCodeMeta } from './src/lib/unified/remark-code-meta.js'
// import { rehypePreCode } from './src/lib/unified/rehype-pre-code.js'
import { transformers } from './src/lib/unified/shiki-transformers.js'

const __dirname = url.fileURLToPath(new URL('.', import.meta.url))

const relativeBlueprintPath = path.join('src', 'lib', 'components', 'markdown', 'index.ts')

/**
 * @satisfies {import('@sveltejs/kit').Config}
 */
const config = {
  extensions: ['.svelte', '.md'],

  preprocess: [
    mdsxPreprocess({
      blueprints: {
        default: {
          path: path.resolve(__dirname, relativeBlueprintPath),
        },
      },
      unified: (processor) => {
        return (
          processor
            // These might not work here.
            // .use(remarkCodeMeta)
            // .use(rehypePreCode)
            .use(rehypeSlug)
            .use(rehypeAutolinkHeadings, { properties: { class: 'header-anchor' } })
            .use(shikiRehype, {
              addLanguageClass: true,
              defaultColor: false,
              parseMetaString,
              themes: {
                light: 'github-light',
                dark: 'github-dark-high-contrast',
              },
              transformers: [
                ...transformers,
                transformerTwoslash({
                  explicitTrigger: true,
                  langs: ['ts', 'tsx', 'svelte'],
                  twoslasher: createTwoslasher(),
                  twoslashOptions: {
                    compilerOptions: {
                      jsx: ts.JsxEmit.Preserve,
                      paths: {
                        $lib: ['./src/lib'],
                        '$lib/*': ['./src/lib/*'],
                      },
                      moduleResolution: ts.ModuleResolutionKind.Bundler,
                      module: ts.ModuleKind.ESNext,
                      target: ts.ScriptTarget.ESNext,
                    },
                  },
                  renderer: rendererFloatingSvelte(),
                }),
              ],
            })
        )
      },
    }),
  ],
}

export default config

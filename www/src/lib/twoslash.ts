import { createTransformerFactory } from '@shikijs/twoslash'
import { createTwoslashFromCDN } from 'twoslash-cdn'
import ts from 'typescript'

export const twoslash = createTwoslashFromCDN({
  compilerOptions: {
    jsx: ts.JsxEmit.Preserve,
    lib: ['esnext', 'DOM'],
    paths: {
      $lib: ['./src/lib'],
      '$lib/*': ['./src/lib/*'],
    },
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ESNext,
  },
})

export const transformerTwoslashFactory = createTransformerFactory(twoslash.runSync)

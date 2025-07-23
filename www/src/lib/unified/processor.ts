import remarkGfm from 'remark-gfm'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import { unified } from 'unified'
import { VFile } from 'vfile'

import { rehypePreCode } from '$lib/unified/rehype-pre-code'
import { remarkCodeMeta } from '$lib/unified/remark-code-meta'
import { remarkWysiwyg } from '$lib/unified/remark-wysiwyg'
import { rehypeShiki } from '$lib/unified/shiki'

export const processor = unified()
  .use(remarkParse)
  .use(remarkWysiwyg)
  .use(remarkGfm)
  .use(remarkCodeMeta)
  .use(remarkRehype, { allowDangerousHtml: true })
  .use(rehypeShiki)
  .use(rehypePreCode)

export async function parseAndRun(content?: string | null | undefined, vfile?: VFile) {
  const file = new VFile(vfile)

  file.value = content || ''

  const root = processor.parse(file)

  const transformedRoot = await processor.run(root, file)

  return [transformedRoot, file] as const
}

export function parseAndRunSync(content?: string | null | undefined, vfile?: VFile) {
  const file = new VFile(vfile)

  file.value = content || ''

  const root = processor.parse(file)

  const transformedRoot = processor.runSync(root, file)

  return transformedRoot
}

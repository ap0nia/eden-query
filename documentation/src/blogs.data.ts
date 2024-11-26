import fs from 'node:fs'
import path from 'node:path'

import { createMarkdownRenderer, defineLoader, type MarkdownEnv } from 'vitepress'

import { BLOGS_DIRECTORY, DOCS_DIRECTORY } from './constants'
import { processIncludes } from './utils/process-includes'
import { getClosestProjectDirectory } from './utils/project'
import { slash } from './utils/slash'

export type Blog = {
  title: string
  detail: string
  href: string
}

declare const data: Blog[]

export { data }

const loader = defineLoader({
  load: async () => {
    const blogs: Blog[] = []

    const projectRoot = getClosestProjectDirectory()

    const resolvedSrcDirectory = path.join(projectRoot, DOCS_DIRECTORY)

    const resolvedBlogsDirectory = path.join(projectRoot, BLOGS_DIRECTORY)

    const md = await createMarkdownRenderer(resolvedSrcDirectory)

    const files = fs.readdirSync(resolvedBlogsDirectory)

    for (const file of files) {
      const includes: string[] = []

      const realPath = path.join(resolvedBlogsDirectory, file)

      const relativePath = slash(path.relative(resolvedBlogsDirectory, file))

      let src = fs.readFileSync(realPath, 'utf8')

      src = processIncludes(resolvedSrcDirectory, src, file, includes)

      const env: MarkdownEnv = {
        path: realPath,
        relativePath,
        cleanUrls: false,
        includes,
        realPath,
        // localeIndex,
      }

      md.render(src, env)

      const title = env.frontmatter?.['title']
      const href = path.relative(resolvedSrcDirectory, realPath)
      const detail = env.frontmatter?.['detail']

      if (typeof title === 'string' && href && typeof detail === 'string') {
        blogs.push({ title, href, detail })
      }
    }

    return blogs
  },
})

export default loader

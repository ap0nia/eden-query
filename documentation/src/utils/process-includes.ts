import fs from 'node:fs'
import path from 'node:path'

import brush from '@griseo.js/brush'
import matter from 'gray-matter'

import { findRegion } from './markdown-snippet'
import { slash } from './slash'

/**
 * @see https://github.com/vuejs/vitepress/blob/3c40e9d9a8443433f49599111ee571d569de530d/src/node/utils/processIncludes.ts
 */
export function processIncludes(
  srcDir: string,
  src: string,
  file: string,
  includes: string[],
): string {
  const includesRE = /<!--\s*@include:\s*(.*?)\s*-->/g
  const regionRE = /(#[\w-]+)/
  const rangeRE = /\{(\d*),(\d*)\}$/

  return src.replaceAll(includesRE, (m: string, m1: string) => {
    if (m1.length === 0) return m

    const range = m1.match(rangeRE)
    const region = m1.match(regionRE)

    const hasMeta = !!(region || range)

    if (hasMeta) {
      const len = (region?.[0].length || 0) + (range?.[0].length || 0)
      m1 = m1.slice(0, -len) // remove meta info from the include path
    }

    const atPresent = m1[0] === '@'

    try {
      const includePath = atPresent
        ? path.join(srcDir, m1.slice(m1[1] === '/' ? 2 : 1))
        : path.join(path.dirname(file), m1)
      let content = fs.readFileSync(includePath, 'utf8')

      if (region) {
        const [regionName] = region
        const lines = content.split(/\r?\n/)
        const regionLines = findRegion(lines, regionName.slice(1))
        content = lines.slice(regionLines?.start, regionLines?.end).join('\n')
      }

      if (range) {
        const [, startLine, endLine] = range
        const lines = content.split(/\r?\n/)
        content = lines
          .slice(
            startLine ? Number.parseInt(startLine, 10) - 1 : undefined,
            endLine ? Number.parseInt(endLine, 10) : undefined,
          )
          .join('\n')
      }

      if (!hasMeta && path.extname(includePath) === '.md') {
        content = matter(content).content
      }

      includes.push(slash(includePath))
      // recursively process includes in the content
      return processIncludes(srcDir, content, includePath, includes)

      //
    } catch {
      if (process.env['DEBUG']) {
        process.stderr.write(brush.yellow(`\nInclude file not found: ${m1}`))
      }

      return m // silently ignore error if file is not present
    }
  })
}

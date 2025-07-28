// @ts-check

import childProcess from 'node:child_process'
import fs from 'node:fs'
import { basename, dirname } from 'node:path'

const cache = new Map()

/**
 * @see https://github.com/vuejs/vitepress/blob/51f7fda0bde018888f1287ed35e29ef8421fb86d/src/node/utils/getGitTimestamp.ts
 *
 * @param {string} file
 */
export function getGitTimestamp(file) {
  const cached = cache.get(file)

  if (cached) return cached

  if (!fs.existsSync(file)) return 0

  return new Promise((resolve, reject) => {
    const child = childProcess.spawn('git', ['log', '-1', '--pretty="%ai"', basename(file)], {
      cwd: dirname(file),
    })

    let output = ''

    child.stdout.on('data', (d) => (output += String(d)))

    child.on('close', () => {
      const timestamp = +new Date(output)
      cache.set(file, timestamp)
      resolve(timestamp)
    })

    child.on('error', reject)
  })
}

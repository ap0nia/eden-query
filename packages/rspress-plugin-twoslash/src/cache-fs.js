import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import process from 'node:process'

/**
 * @type import('./cache-fs').createFileSystemTypesCache
 */
export function createFileSystemTypesCache(options = {}) {
  const dir = resolve(process.cwd(), options.dir ?? '.vitepress/cache/twoslash')

  return {
    init() {
      mkdirSync(dir, { recursive: true })
    },
    read(code) {
      const hash = createHash('SHA256').update(code).digest('hex').slice(0, 12)
      const filePath = join(dir, `${hash}.json`)
      if (!existsSync(filePath)) {
        return null
      }
      return JSON.parse(readFileSync(filePath, { encoding: 'utf-8' }))
    },
    write(code, data) {
      const hash = createHash('SHA256').update(code).digest('hex').slice(0, 12)
      const filePath = join(dir, `${hash}.json`)
      const json = JSON.stringify(data)
      writeFileSync(filePath, json, { encoding: 'utf-8' })
    },
  }
}

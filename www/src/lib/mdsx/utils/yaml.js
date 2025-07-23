// @ts-check

import yaml from 'yaml'

/**
 * Front-matter is typically denoted by triple dashes.
 */
const FRONT_MATTER_REGEX = /^---(?:\r?\n|\r)(?:([\s\S]*?)(?:\r?\n|\r))?---(?:\r?\n|\r|$)/

/**
 * Parses the front-matter from a file, returning an object representing the front-matter.
 * May also return a new value for the file if the front-matter should be omitted from further processing.
 *
 * @param {import('vfile').VFile} file
 * @param {((str: string) => Record<string, unknown> | void)} [customParser]
 * @returns {{ matter: Record<string, any>, value?: string }}
 */
export function parseFrontmatter(file, customParser) {
  const doc = String(file)

  let matter = {}

  if (customParser) {
    matter = customParser(doc) ?? matter
    return { matter }
  }

  const match = FRONT_MATTER_REGEX.exec(String(file))

  if (match?.[1] == null) {
    return { matter }
  }

  matter = yaml.parse(match[1])

  const stripped = doc.slice(match[0].length)

  let value = stripped

  if (file.value && typeof file.value === 'object') {
    file.value = new TextEncoder().encode(stripped)
  }

  return { matter, value }
}

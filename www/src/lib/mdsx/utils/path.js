// @ts-check

import path from 'node:path'

/**
 * @param {string} to
 * @param {string} from
 */
export function getRelativeFilePath(from, to) {
  const fromParentDirectory = path.resolve(from, '..')

  const relativePath = path.relative(fromParentDirectory, to)

  const relativeNormalizedPath = path.posix.normalize(relativePath)

  if (!relativeNormalizedPath.startsWith('.')) {
    return `./${relativeNormalizedPath}`
  }

  return relativeNormalizedPath
}

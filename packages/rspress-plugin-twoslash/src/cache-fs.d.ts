import type { TwoslashTypesCache } from '.'

export interface FileSystemTypeResultCacheOptions {
  /**
   * The directory to store the cache files.
   *
   * @default '.vitepress/cache/twoslash'
   */
  dir?: string
}

export function createFileSystemTypesCache(
  options: FileSystemTypeResultCacheOptions = {},
): TwoslashTypesCache

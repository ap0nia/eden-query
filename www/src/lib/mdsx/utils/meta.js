/**
 * @type import('./meta').parseBlockMetaString
 *
 * @see https://github.com/rehype-pretty/rehype-pretty-code/blob/eba61cbe7cb22a230702ff1e20b4483b917ae220/packages/core/src/utils.ts#L56C1-L89C2
 */
export function parseBlockMetaString(meta) {
  const titleMatch = meta.match(/title="([^"]*)"/)
  const title = titleMatch?.[1] ?? null
  meta = meta.replace(titleMatch?.[0] ?? '', '')

  const captionMatch = meta.match(/caption="([^"]*)"/)
  const caption = captionMatch?.[1] ?? null
  meta = meta.replace(captionMatch?.[0] ?? '', '')

  return {
    title,
    caption,
    meta,
  }
}

/**
 * @type import('./meta').parseMetaString
 */
export function parseMetaString(meta) {
  const sections = meta.split(' ')

  const entries = sections.reduce((previous, current) => {
    const [key, value] = current.split('=')

    const isNormalKey = key && /^[A-Z0-9_]+$/i.test(key)

    if (isNormalKey) return [...previous, [key, value || true]]

    return previous
  }, /** @type Array<Array<boolean | string>> */ ([]))

  const parsedMeta = Object.fromEntries(entries)

  const rehypePrettyCodeParsedMeta = parseBlockMetaString(meta)

  const resolvedMeta = {
    ...parsedMeta,
    ...rehypePrettyCodeParsedMeta,
    /**
     * @link {parsedMeta} can read title= values without being enclosed in double quotes.
     * rehypePrettyCode does not. Allow either one.
     *
     * @example
     *
     * ```js title=hello.js
     * ```
     *
     * @example
     *
     * ```js title="hello.js"
     * ```
     */
    title: rehypePrettyCodeParsedMeta.title || parsedMeta['title'],
    caption: rehypePrettyCodeParsedMeta.caption || parsedMeta['caption'],
  }

  return resolvedMeta
}

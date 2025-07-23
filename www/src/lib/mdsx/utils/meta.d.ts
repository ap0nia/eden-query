export type BlockMeta = {
  title: string | null
  caption: string | null
  meta: string
}

/**
 * @see https://github.com/rehype-pretty/rehype-pretty-code/blob/eba61cbe7cb22a230702ff1e20b4483b917ae220/packages/core/src/utils.ts#L56C1-L89C2
 */
export function parseBlockMetaString(meta: string): BlockMeta

/**
 */
export function parseMetaString(meta: string): Record<string, any>

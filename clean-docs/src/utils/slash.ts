/**
 * @see https://github.com/vuejs/vitepress/blob/3c40e9d9a8443433f49599111ee571d569de530d/src/shared/shared.ts
 */
export function slash(p: string): string {
  return p.replace(/\\/g, '/')
}

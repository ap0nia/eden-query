export function createUrl(path: string, query?: URLSearchParams): string {
  return path + (query?.size ? `?${query.toString()}` : '')
}

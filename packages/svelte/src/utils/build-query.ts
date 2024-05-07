export function buildQuery(query: Record<string, any>): string {
  let q = ''

  if (query) {
    const append = (key: string, value: string) => {
      q += (q ? '&' : '?') + `${encodeURIComponent(key)}=${encodeURIComponent(value)}`
    }

    for (const [key, value] of Object.entries(query)) {
      if (Array.isArray(value)) {
        for (const v of value) append(key, v)
        continue
      }

      append(key, `${value}`)
    }
  }

  return q
}

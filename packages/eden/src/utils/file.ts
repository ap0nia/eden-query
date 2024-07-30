import { IS_SERVER } from '../constants'

export function isFile(v: any) {
  if (IS_SERVER) return v instanceof Blob

  return v instanceof FileList || v instanceof File
}

export function hasFile(object?: Record<string, any>): boolean {
  if (!object) {
    return false
  }

  for (const key in object) {
    if (isFile(object[key])) return true

    if (Array.isArray(object[key]) && (object[key] as unknown[]).find(isFile)) return true
  }

  return false
}

import { IS_SERVER } from '../constants'

export function isFile(v: unknown): v is Blob | FileList | File {
  if (IS_SERVER) return v instanceof Blob
  return v instanceof FileList || v instanceof File
}

// FormData is 1 level deep
export function hasFile(obj: Record<string, any>) {
  if (!obj) return false

  for (const key in obj) {
    if (isFile(obj[key])) return true

    if (Array.isArray(obj[key]) && (obj[key] as unknown[]).find(isFile)) return true
  }

  return false
}

export function createNewFile(v: File) {
  return IS_SERVER
    ? v
    : new Promise<File>((resolve) => {
        const reader = new FileReader()

        reader.onload = () => {
          const file = new File([reader.result!], v.name, {
            lastModified: v.lastModified,
            type: v.type,
          })
          resolve(file)
        }

        reader.readAsArrayBuffer(v)
      })
}

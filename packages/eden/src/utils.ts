import { HTTP_METHODS, IS_SERVER } from './constants'

const isISO8601 =
  /(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z))/
const isFormalDate =
  /(?:Sun|Mon|Tue|Wed|Thu|Fri|Sat)\s(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s\d{2}\s\d{4}\s\d{2}:\d{2}:\d{2}\sGMT(?:\+|-)\d{4}\s\([^)]+\)/
const isShortenDate =
  /^(?:(?:(?:(?:0?[1-9]|[12][0-9]|3[01])[/\s-](?:0?[1-9]|1[0-2])[/\s-](?:19|20)\d{2})|(?:(?:19|20)\d{2}[/\s-](?:0?[1-9]|1[0-2])[/\s-](?:0?[1-9]|[12][0-9]|3[01]))))(?:\s(?:1[012]|0?[1-9]):[0-5][0-9](?::[0-5][0-9])?(?:\s[AP]M)?)?$/

function isNumericString(message: string) {
  return message.trim().length !== 0 && !Number.isNaN(Number(message))
}

export function parseStringifiedDate(value: any) {
  if (typeof value !== 'string') {
    return null
  }

  // Remove quote from stringified date
  const temp = value.replace(/"/g, '')

  if (isISO8601.test(temp) || isFormalDate.test(temp) || isShortenDate.test(temp)) {
    const date = new Date(temp)

    if (!Number.isNaN(date.getTime())) {
      return date
    }
  }

  return null
}

function isStringifiedObject(value: string) {
  const start = value.charCodeAt(0)
  const end = value.charCodeAt(value.length - 1)

  return (start === 123 && end === 125) || (start === 91 && end === 93)
}

export function parseStringifiedObject(data: string) {
  return JSON.parse(data, (_, value) => {
    const date = parseStringifiedDate(value)

    if (date) {
      return date
    }

    return value
  })
}

export function parseStringifiedValue(value: string) {
  if (!value) {
    return value
  }

  if (isNumericString(value)) {
    return +value
  }

  if (value === 'true') {
    return true
  }

  if (value === 'false') {
    return false
  }

  const date = parseStringifiedDate(value)

  if (date) {
    return date
  }

  if (isStringifiedObject(value)) {
    try {
      return parseStringifiedObject(value)
    } catch {
      // noop
    }
  }

  return value
}

export function parseMessageEvent(event: MessageEvent) {
  const messageString = event.data.toString()

  return messageString === 'null' ? null : parseStringifiedValue(messageString)
}

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

export function isHttpMethod(value: unknown): boolean {
  return HTTP_METHODS.includes(value as any)
}

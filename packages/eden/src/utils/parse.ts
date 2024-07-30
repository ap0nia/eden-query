import { FORMAL_DATE_REGEX, ISO8601_REGEX, SHORTENED_DATE_REGEX } from '../constants'

function isNumericString(message: string) {
  return message.trim().length !== 0 && !Number.isNaN(Number(message))
}

function isStringifiedObject(value: string): boolean {
  const start = value.charCodeAt(0)
  const end = value.charCodeAt(value.length - 1)

  return (start === 123 && end === 125) || (start === 91 && end === 93)
}

export function parseStringifiedDate(value: unknown): Date | null {
  if (typeof value !== 'string') {
    return null
  }

  // Remove quote from stringified date
  const temp = value.replace(/"/g, '')

  if (ISO8601_REGEX.test(temp) || FORMAL_DATE_REGEX.test(temp) || SHORTENED_DATE_REGEX.test(temp)) {
    const date = new Date(temp)

    if (!Number.isNaN(date.getTime())) {
      return date
    }
  }

  return null
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

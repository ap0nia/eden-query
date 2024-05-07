export function isNumericString(message: string) {
  return message.trim().length !== 0 && !Number.isNaN(Number(message))
}

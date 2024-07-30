import { GET_OR_HEAD_HTTP_METHODS, HTTP_METHODS } from '../constants'

export function isHttpMethod(value: unknown): boolean {
  return HTTP_METHODS.includes(value as any)
}

export function isGetOrHeadMethod(value: unknown): boolean {
  return GET_OR_HEAD_HTTP_METHODS.includes(value as any)
}

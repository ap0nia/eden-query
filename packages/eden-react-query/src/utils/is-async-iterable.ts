import { isObject } from './is-object'

export function isAsyncIterable<TValue>(value: unknown): value is AsyncIterable<TValue> {
  const asyncIteratorsSupported = typeof Symbol === 'function' && !!Symbol.asyncIterator
  return asyncIteratorsSupported && isObject(value) && Symbol.asyncIterator in value
}

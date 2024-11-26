/**
 * Given a dot-concatenated string path, deeply set a property, filling in any missing objects along the way.
 */
export function set<T>(object: unknown, key: PropertyKey, value: unknown): T {
  if (object == undefined) {
    return value as any
  }

  if (typeof key === 'number' || typeof key === 'symbol') {
    object[key as keyof typeof object] = value as never
    return object[key as keyof typeof object] as T
  }

  const keyArray = key
    .replaceAll(/["|']|\]/g, '')
    .split(/\.|\[/)
    .filter(Boolean)

  const lastIndex = keyArray.length - 1

  const lastKey = keyArray[lastIndex]

  // eslint-disable-next-line unicorn/no-array-reduce
  const result = keyArray.reduce((currentResult, currentKey, index) => {
    if (index === lastIndex) {
      currentResult[currentKey as keyof typeof currentResult] = value as never
      return currentResult
    }

    currentResult[currentKey as keyof typeof currentResult] ??= (
      Number.isNaN(keyArray[index + 1] as any) ? {} : []
    ) as never

    return currentResult[currentKey as keyof typeof currentResult]
  }, object)

  return result[lastKey as keyof typeof result] as T
}

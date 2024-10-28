/**
 * @see https://github.com/trpc/trpc/pull/669
 */
export function arrayToDict(array: unknown[]) {
  const dict: Record<number, unknown> = {}

  for (let index = 0; index < array.length; index++) {
    const element = array[index]
    dict[index] = element
  }

  return dict
}

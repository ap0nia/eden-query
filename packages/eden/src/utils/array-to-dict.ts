/**
 * @see https://github.com/trpc/trpc/pull/669
 */
export function arrayToDict(array: unknown[]) {
  const dict: Record<number, unknown> = {}

  for (const [index, element] of array.entries()) {
    dict[index] = element
  }

  return dict
}

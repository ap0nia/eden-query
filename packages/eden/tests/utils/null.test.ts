import { describe, expect, test } from 'vitest'

import { notNull } from '../../src/utils/null'

describe('notNull', () => {
  test('returns false for nullish types', () => {
    expect(notNull(undefined)).toBe(false)
    expect(notNull(null)).toBe(false)
  })
})

import { describe, expect, test } from 'vitest'

import { asyncConstNoop, asyncNoop, constNoop, noop } from '../../src/utils/noop'

describe('noop', () => {
  test('noop returns nothing', () => {
    expect(noop()).toBe(undefined)
  })

  test('async noop returns nothing', async () => {
    await expect(asyncNoop()).resolves.toBe(undefined)
  })

  test('const noop returns provided value', () => {
    const value = 'Hello'

    const noopReturningValue = constNoop(value)

    expect(noopReturningValue()).toBe(value)
  })

  test('async const noop returns promise with provided value', async () => {
    const value = 'Hello'

    const asyncNoopReturningValue = asyncConstNoop(value)

    await expect(asyncNoopReturningValue()).resolves.toBe(value)
  })
})

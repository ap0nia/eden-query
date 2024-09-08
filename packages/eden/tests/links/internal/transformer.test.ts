import { describe, expect, test } from 'vitest'

import {
  type CombinedDataTransformer,
  type DataTransformer,
  getDataTransformer,
} from '../../../src/links/internal/transformer'

describe('getDataTransformer', () => {
  test('returns null for nullish input', () => {
    expect(getDataTransformer(undefined)).toBeUndefined()
  })

  test('returns the same transformer for input and output', () => {
    const transformer: DataTransformer = {
      serialize: () => {},
      deserialize: () => {},
    }

    const dataTransformer = getDataTransformer(transformer)

    expect(dataTransformer?.input).toBe(transformer)
    expect(dataTransformer?.output).toBe(transformer)
  })

  test('returns the transformer as-is if it already has input and output', () => {
    const transformer: CombinedDataTransformer = {
      input: {
        serialize: () => {},
        deserialize: () => {},
      },
      output: {
        serialize: () => {},
        deserialize: () => {},
      },
    }

    const dataTransformer = getDataTransformer(transformer)

    expect(dataTransformer).toBe(transformer)
  })
})

import { describe, expect, test } from 'vitest'

import {
  type CombinedDataTransformer,
  type DataTransformer,
  getDataTransformer,
} from '../../../src/links/internal/transformer'

describe('getDataTransformer', () => {
  test('returns default transformer for nullish input', () => {
    const dataTransformer = getDataTransformer()

    expect(dataTransformer).toBeDefined()

    const value = 'Elysia'

    expect(dataTransformer.input.serialize(value)).toBe(value)
    expect(dataTransformer.input.deserialize(value)).toBe(value)
    expect(dataTransformer.output.serialize(value)).toBe(value)
    expect(dataTransformer.output.deserialize(value)).toBe(value)
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

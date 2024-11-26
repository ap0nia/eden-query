import { describe, expect, test } from 'vitest'

import { createChain } from '../../../src/links/internal/create-chain'
import { OperationError, type OperationLink } from '../../../src/links/internal/operation'

describe('createChain', () => {
  test('throws error if the last link calls next', () => {
    // eslint-disable-next-line unicorn/consistent-function-scoping
    const link: OperationLink = ({ operation, next }) => {
      return next(operation)
    }

    const operation: any = {}

    const chain = createChain({ links: [link], operation })

    expect(chain.subscribe.bind(chain)).toThrowError(OperationError)
  })
})

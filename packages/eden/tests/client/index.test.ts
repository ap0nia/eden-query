import { describe, expect, test } from 'vitest'

import { EdenClient } from '../../src/client'
import type { EdenRequestOptions } from '../../src/core/config'
import { Observable } from '../../src/observable'

describe('EdenClient', () => {
  const response = new Response()

  test('initializes with no options provided', () => {
    expect(() => new EdenClient({ links: [] })).not.toThrowError()
  })

  describe('throws error when submitting request without links', () => {
    test('query', async () => {
      const client = new EdenClient({ links: [] })
      await expect(async () => await client.query('/')).rejects.toThrowError()
    })

    test('mutation', async () => {
      const client = new EdenClient({ links: [] })
      await expect(async () => await client.mutation('/')).rejects.toThrowError()
    })

    test('subscription', () => {
      const client = new EdenClient({ links: [] })
      expect(() => client.subscription('/')).toThrowError()
    })
  })

  describe('links', () => {
    describe('handle data correctly', () => {
      test('returns data from observable as promise result', async () => {
        const data = {
          bigint: 1n,
          object: {
            string: 'string',
          },
        }

        const client = new EdenClient({
          links: [
            () => {
              return () => {
                return new Observable((observer) => {
                  observer.next({ result: { type: 'data', data, response }, context: {} })
                })
              }
            },
          ],
        })

        const result = await client.query('/')

        expect(result.data).toBe(data)
      })

      test('returns correct params', async () => {
        const params = {
          body: {
            bigint: 1n,
            object: {
              string: 'string',
            },
          },
        } satisfies EdenRequestOptions

        const client = new EdenClient({
          links: [
            () => {
              return ({ op }) => {
                return new Observable((observer) => {
                  observer.next({
                    result: { type: 'data', data: op.params, response },
                    context: {},
                  })
                })
              }
            },
          ],
        })

        const result = await client.query('/', params)

        expect(result.data).toBe(params)
      })
    })

    describe('handles chaining properly', () => {
      test('previous link can mutate operation', async () => {
        const params = {
          body: {
            bigint: 1n,
            object: {
              string: 'string',
            },
          },
        } satisfies EdenRequestOptions

        const client = new EdenClient({
          links: [
            () => {
              return ({ op, next }) => {
                op.params = params
                return next(op)
              }
            },
            () => {
              return ({ op }) => {
                return new Observable((observer) => {
                  observer.next({
                    result: { type: 'data', data: op.params, response },
                    context: {},
                  })
                })
              }
            },
          ],
        })

        const result = await client.query('/')

        expect(result.data).toBe(params)
      })
    })
  })
})

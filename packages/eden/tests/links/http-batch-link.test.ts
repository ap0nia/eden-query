import { describe, expect, test } from 'vitest'

import type { EdenRequestParams } from '../../src'
import {
  generateGetBatchRequestInformation,
  generatePostBatchRequestInformation,
} from '../../src/links/http-batch-link'
import type { Operation } from '../../src/links/internal/operation'

describe('http-batch-link', () => {
  describe('generateGetBatchParams', () => {
    test('encodes method', () => {
      const method = 'GET'
      const operation: Operation = {
        id: 0,
        type: 'query',
        params: {
          method,
        },
        context: {},
      }

      const information = generateGetBatchRequestInformation([operation])

      const urlSearchParams = new URLSearchParams(information.query)

      expect(urlSearchParams).toContainEqual(['0.method', method])
    })

    test('can encode single query', () => {
      const query = {
        hello: 'Elysia',
      }

      const operation: Operation = {
        id: 0,
        type: 'query',
        params: {
          options: {
            query,
          },
        },
        context: {},
      }

      const information = generateGetBatchRequestInformation([operation])

      const urlSearchParams = new URLSearchParams(information.query)

      expect(urlSearchParams).toContainEqual(['0.query.hello', query.hello])
    })

    test('ignores nullish values in query', () => {
      const query = {
        hello: 'Elysia',
        bye: null,
        no: undefined,
      }

      const operation: Operation = {
        id: 0,
        type: 'query',
        params: {
          options: {
            query,
          },
        },
        context: {},
      }

      const information = generateGetBatchRequestInformation([operation])

      const urlSearchParams = new URLSearchParams(information.query)

      expect(urlSearchParams).toContainEqual(['0.query.hello', query.hello])
      expect(urlSearchParams).not.toContainEqual(['0.query.bye', query.bye])
      expect(urlSearchParams).not.toContainEqual(['0.query.no', query.no])
    })

    test('can encode multiple queries', () => {
      const queries = [
        {
          hello: 'Elysia',
        },
        {
          hello: 'Aponia',
        },
        {
          hello: 'Eden',
        },
      ]

      const operations: Operation[] = queries.map((query) => {
        return {
          id: 0,
          type: 'query',
          params: {
            options: {
              query,
            },
          },
          context: {},
        }
      })

      const information = generateGetBatchRequestInformation(operations)

      const urlSearchParams = new URLSearchParams(information.query)

      for (let i = 0; i < queries.length; ++i) {
        const pair = [`${i}.query.hello`, queries[i]?.hello]

        expect(urlSearchParams).toContainEqual(pair)
      }
    })

    test('substitutes path parameters', () => {
      const params: EdenRequestParams[] = [
        {
          path: '/users/:id',
          options: {
            params: {
              id: 'Elysia',
            },
          },
        },
        {
          path: '/people/:name',
          options: {
            params: {
              name: 'Aponia',
            },
          },
        },
        {
          path: '/singers/:person',
          options: {
            params: {
              person: 'Eden',
            },
          },
        },
      ]

      const operations: Operation[] = params.map((params) => {
        return {
          id: 0,
          type: 'query',
          params,
          context: {},
        }
      })

      const information = generateGetBatchRequestInformation(operations)

      const urlSearchParams = new URLSearchParams(information.query)

      for (let i = 0; i < params.length; ++i) {
        const current = params[i]

        if (current == null) continue

        let finalPath = current.path ?? ''

        for (const key in current.options?.params) {
          finalPath = finalPath.replace(`:${key}`, current.options?.params[key as never])
        }

        const pair = [`${i}.path`, finalPath]

        expect(urlSearchParams).toContainEqual(pair)
      }
    })
  })

  describe('generatePostBatchParams', () => {
    test('encodes method', () => {
      const method = 'GET'
      const operation: Operation = {
        id: 0,
        type: 'query',
        params: {
          method,
        },
        context: {},
      }

      const information = generatePostBatchRequestInformation([operation])

      expect(information.body).toContainEqual(['0.method', method])
    })

    test('can encode single query', () => {
      const query = {
        hello: 'Elysia',
      }

      const operation: Operation = {
        id: 0,
        type: 'query',
        params: {
          options: {
            query,
          },
        },
        context: {},
      }

      const information = generatePostBatchRequestInformation([operation])

      expect(information.body).toContainEqual(['0.query.hello', query.hello])
    })

    test('ignores nullish values in query', () => {
      const query = {
        hello: 'Elysia',
        bye: null,
        no: undefined,
      }

      const operation: Operation = {
        id: 0,
        type: 'query',
        params: {
          options: {
            query,
          },
        },
        context: {},
      }

      const information = generatePostBatchRequestInformation([operation])

      expect(information.body).toContainEqual(['0.query.hello', query.hello])
      expect(information.body).not.toContainEqual(['0.query.bye', query.bye])
      expect(information.body).not.toContainEqual(['0.query.no', query.no])
    })

    test('can encode multiple queries', () => {
      const queries = [
        {
          hello: 'Elysia',
        },
        {
          hello: 'Aponia',
        },
        {
          hello: 'Eden',
        },
      ]

      const operations: Operation[] = queries.map((query) => {
        return {
          id: 0,
          type: 'query',
          params: {
            options: {
              query,
            },
          },
          context: {},
        }
      })

      const information = generatePostBatchRequestInformation(operations)

      for (let i = 0; i < queries.length; ++i) {
        const pair = [`${i}.query.hello`, queries[i]?.hello]

        expect(information.body).toContainEqual(pair)
      }
    })

    test('substitutes path parameters', () => {
      const params: EdenRequestParams[] = [
        {
          path: '/users/:id',
          options: {
            params: {
              id: 'Elysia',
            },
          },
        },
        {
          path: '/people/:name',
          options: {
            params: {
              name: 'Aponia',
            },
          },
        },
        {
          path: '/singers/:person',
          options: {
            params: {
              person: 'Eden',
            },
          },
        },
      ]

      const operations: Operation[] = params.map((params) => {
        return {
          id: 0,
          type: 'query',
          params,
          context: {},
        }
      })

      const information = generatePostBatchRequestInformation(operations)

      for (let i = 0; i < params.length; ++i) {
        const current = params[i]

        if (current == null) continue

        let finalPath = current.path ?? ''

        for (const key in current.options?.params) {
          finalPath = finalPath.replace(`:${key}`, current.options?.params[key as never])
        }

        const pair = [`${i}.path`, finalPath]

        expect(information.body).toContainEqual(pair)
      }
    })
  })
})

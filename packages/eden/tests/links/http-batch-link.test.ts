import { describe, expect, test } from 'vitest'

import {
  generateGetBatchRequestInformation,
  generatePostBatchRequestInformation,
  httpBatchLink,
} from '../../src/links/http-batch-link'
import { BatchError } from '../../src/links/internal/batched-data-loader'
import { Observable, promisifyObservable } from '../../src/links/internal/observable'
import { type Operation, OperationError } from '../../src/links/internal/operation'
import type { EdenRequestParams } from '../../src/resolve'

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

  test('merges default headers function', () => {
    const headers = {
      name: 'Elysia',
    }

    const operation: Operation = {
      id: 0,
      type: 'query',
      params: {
        headers: () => headers,
      },
      context: {},
    }

    const information = generateGetBatchRequestInformation([operation])

    expect(information.headers).toContainEqual(['name', headers.name])
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

  test('merges default headers function', () => {
    const headers = {
      name: 'Elysia',
    }

    const operation: Operation = {
      id: 0,
      type: 'query',
      params: {
        headers: () => headers,
      },
      context: {},
    }

    const information = generatePostBatchRequestInformation([operation])

    expect(information.headers).toContainEqual(['name', headers.name])
  })

  test('can handle formData body', () => {
    const formData1 = new FormData()
    const formData2 = new FormData()
    const formData3 = new FormData()

    const key = 'hello'
    const value = new Blob()
    formData1.append(key, value)

    const formDatas = [formData1, formData2, formData3]

    const operations: Operation[] = formDatas.map((body) => {
      return {
        id: 0,
        type: 'query',
        params: {
          body,
        },
        context: {},
      }
    })

    const information = generatePostBatchRequestInformation(operations)

    for (let i = 0; i < operations.length; ++i) {
      expect(information.body).toContainEqual([`${i}.body_type`, 'formdata'])
    }

    // Not sure best way to test. We just want to assert that adding a blob
    // from a nested form data will actually appear.
    expect(information.body.get(`0.body.${key}`)).toEqual(expect.any(Blob))
  })

  test('can handle json body', () => {
    const body1 = {}
    const body2 = {}
    const body3 = {}

    const bodies = [body1, body2, body3]

    const operations: Operation[] = bodies.map((body) => {
      return {
        id: 0,
        type: 'query',
        params: {
          body,
        },
        context: {},
      }
    })

    const information = generatePostBatchRequestInformation(operations)

    for (let i = 0; i < operations.length; ++i) {
      expect(information.body).toContainEqual([`${i}.body_type`, 'json'])
    }

    // For JSON body, there are no subkeys, the value at `${index}.body` is
    // the entire stringified JSON value.
    expect(information.body.get(`0.body`)).toEqual(JSON.stringify(body1))
  })
})

describe('httpBatchLink', () => {
  describe('get', () => {
    test('will not make any requests if all operations fail max URL length', () => {
      const batchLink = httpBatchLink({ method: 'GET', maxURLLength: 1 })

      const link = batchLink({})

      const operation: Operation = {
        id: 0,
        type: 'query',
        params: {},
        context: {},
      }

      const observable = new Observable((observer) => {
        const rootObservable = link({
          operation,
          next: () => {
            throw new OperationError('No more links expected')
          },
        })
        return rootObservable.subscribe(observer)
      })

      // Subscribing to the observable initiates the request.
      observable.subscribe()
    })
  })

  describe('post', () => {
    test('rejects with error if one request was batched unsuccessfully', async () => {
      const batchLink = httpBatchLink({ method: 'GET', maxURLLength: 0 })

      const link = batchLink({})

      const operation: Operation = {
        id: 0,
        type: 'query',
        params: {},
        context: {},
      }

      const observable = new Observable((observer) => {
        const rootObservable = link({
          operation,
          next: () => {
            throw new OperationError('No more links expected')
          },
        })
        return rootObservable.subscribe(observer)
      })

      const { promise } = promisifyObservable(observable)

      // No valid requests to batch, so it should reject with a batch error.
      expect(promise).rejects.toEqual(expect.any(BatchError))
    })

    test('fails to resolves request if invalid url', async () => {
      const batchLink = httpBatchLink({ method: 'GET' })

      const link = batchLink({})

      const operation: Operation = {
        id: 0,
        type: 'query',
        params: {},
        context: {},
      }

      const observable = new Observable((observer) => {
        const rootObservable = link({
          operation,
          next: () => {
            throw new OperationError('No more links expected')
          },
        })
        return rootObservable.subscribe(observer)
      })

      const { promise } = promisifyObservable(observable)

      // Invalid request that has not been handled by msw.
      expect(promise).rejects.toThrowError()
    })
  })
})

import { describe, expect, test, vi } from 'vitest'

import { EdenClient } from '../../src/client'
import { EdenFetchError } from '../../src/core/error'
import { loggerLink } from '../../src/links/logger-link'
import { Observable } from '../../src/observable'

describe('loggerLink', () => {
  const response = new Response()

  describe('log', () => {
    test('query', async () => {
      const log = vi.fn()
      const error = vi.fn()

      const client = new EdenClient({
        links: [
          loggerLink({ console: { log, error } }),
          () => () => {
            return new Observable((observer) => {
              observer.next({ result: { type: 'data', data: 'OK', response }, context: {} })
              observer.complete()
            })
          },
        ],
      })

      await client.query('/')

      expect(log).toHaveBeenCalledTimes(2)
      expect(error).toHaveBeenCalledTimes(0)

      expect(log).toHaveBeenNthCalledWith(1, expect.stringContaining('>> query'), expect.anything())
      expect(log).toHaveBeenNthCalledWith(2, expect.stringContaining('<< query'), expect.anything())
    })

    test('mutation', async () => {
      const log = vi.fn()
      const error = vi.fn()

      const client = new EdenClient({
        links: [
          loggerLink({ console: { log, error } }),
          () => () => {
            return new Observable((observer) => {
              observer.next({ result: { type: 'data', data: 'OK', response }, context: {} })
              observer.complete()
            })
          },
        ],
      })

      await client.mutation('/')

      expect(log).toHaveBeenCalledTimes(2)
      expect(error).toHaveBeenCalledTimes(0)

      expect(log).toHaveBeenNthCalledWith(
        1,
        expect.stringContaining('>> mutation'),
        expect.anything(),
      )
      expect(log).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining('<< mutation'),
        expect.anything(),
      )
    })
  })

  describe('error', () => {
    test('query', async () => {
      const log = vi.fn()
      const error = vi.fn()

      const client = new EdenClient({
        links: [
          loggerLink({ console: { log, error } }),
          () => () => {
            return new Observable((observer) => {
              observer.error(new EdenFetchError(404, 'Error'))
            })
          },
        ],
      })

      await expect(async () => await client.query('/')).rejects.toThrowError()

      expect(log).toHaveBeenCalledTimes(1)
      expect(error).toHaveBeenCalledTimes(1)
      expect(log).toHaveBeenNthCalledWith(1, expect.stringMatching('>> query'), expect.anything())
      expect(error).toHaveBeenNthCalledWith(
        1,
        expect.stringContaining('<< query'),
        expect.anything(),
      )
    })
  })

  describe('no color', () => {
    test('query', async () => {
      const log = vi.fn()
      const error = vi.fn()

      const client = new EdenClient({
        links: [
          loggerLink({
            console: { log, error },
            colorMode: 'none',
          }),
          () => () => {
            return new Observable((observer) => {
              observer.next({ result: { type: 'data', data: 'OK', response }, context: {} })
              observer.complete()
            })
          },
        ],
      })

      await client.query('/')

      expect(log).toHaveBeenCalledTimes(2)
      expect(error).toHaveBeenCalledTimes(0)

      expect(log).toHaveBeenNthCalledWith(1, expect.stringMatching(/^>> query/), expect.anything())
      expect(log).toHaveBeenNthCalledWith(2, expect.stringMatching(/^<< query/), expect.anything())
    })

    test('mutation', async () => {
      const log = vi.fn()
      const error = vi.fn()

      const client = new EdenClient({
        links: [
          loggerLink({
            console: { log, error },
            colorMode: 'none',
          }),
          () => () => {
            return new Observable((observer) => {
              observer.next({ result: { type: 'data', data: 'OK', response }, context: {} })
              observer.complete()
            })
          },
        ],
      })

      await client.mutation('/')

      expect(log).toHaveBeenCalledTimes(2)
      expect(error).toHaveBeenCalledTimes(0)

      expect(log).toHaveBeenNthCalledWith(
        1,
        expect.stringMatching(/^>> mutation/),
        expect.anything(),
      )
      expect(log).toHaveBeenNthCalledWith(
        2,
        expect.stringMatching(/^<< mutation/),
        expect.anything(),
      )
    })
  })

  test('withContext', async () => {
    const log = vi.fn()
    const error = vi.fn()

    const context = {
      string: 'string',
      object: {
        bigint: 1n,
      },
    }

    const client = new EdenClient({
      links: [
        loggerLink({
          console: { log, error },
          withContext: true,
        }),
        () =>
          ({ op }) => {
            op.context = context
            return new Observable((observer) => {
              observer.next({ result: { type: 'data', data: 'OK', response }, context: {} })
              observer.complete()
            })
          },
      ],
    })

    await client.mutation('/')

    expect(log).toHaveBeenCalledTimes(2)
    expect(error).toHaveBeenCalledTimes(0)

    expect(log).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('>> mutation'),
      expect.anything(),
    )
    expect(log).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('<< mutation'),
      expect.objectContaining({ context }),
    )
  })

  describe('css', () => {
    test('query', async () => {
      const log = vi.fn()
      const error = vi.fn()

      const client = new EdenClient({
        links: [
          loggerLink({ console: { log, error }, colorMode: 'css' }),
          () => () => {
            return new Observable((observer) => {
              observer.next({ result: { type: 'data', data: 'OK', response }, context: {} })
              observer.complete()
            })
          },
        ],
      })

      await client.mutation('/')

      expect(log).toHaveBeenCalledTimes(2)
      expect(error).toHaveBeenCalledTimes(0)

      expect(log.mock.calls).toMatchInlineSnapshot(`
[
  [
    "%c >> mutation #1 %c%c %O",
    "
    background-color: #c5a3fc;
    color: black;
    padding: 2px;
  ",
    "
    background-color: #c5a3fc;
    color: black;
    padding: 2px;
  ; font-weight: bold;",
    "
    background-color: #c5a3fc;
    color: black;
    padding: 2px;
  ; font-weight: normal;",
    {
      "context": {},
      "params": {},
    },
  ],
  [
    "%c << mutation #1 %c%c %O",
    "
    background-color: #904dfc;
    color: white;
    padding: 2px;
  ",
    "
    background-color: #904dfc;
    color: white;
    padding: 2px;
  ; font-weight: bold;",
    "
    background-color: #904dfc;
    color: white;
    padding: 2px;
  ; font-weight: normal;",
    {
      "context": {},
      "elapsedMs": 0,
      "params": {},
      "result": {
        "result": {
          "data": "OK",
          "response": Response {
            Symbol(state): {
              "aborted": false,
              "cacheState": "",
              "headersList": HeadersList {
                "cookies": null,
                Symbol(headers map): Map {},
                Symbol(headers map sorted): null,
              },
              "rangeRequested": false,
              "requestIncludesCredentials": false,
              "status": 200,
              "statusText": "",
              "timingAllowPassed": false,
              "timingInfo": null,
              "type": "default",
              "urlList": [],
            },
            Symbol(headers): Headers {},
          },
          "type": "data",
        },
      },
    },
  ],
]
`)
    })
  })
})

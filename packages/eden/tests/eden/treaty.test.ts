import { Elysia } from 'elysia'
import type { ElysiaWS } from 'elysia/ws'
import SuperJSON from 'superjson'
import { describe, expect, test, vi } from 'vitest'

import { edenTreaty } from '../../src/eden/treaty'
import { httpBatchLink } from '../../src/links/http-batch-link'
import { httpLink } from '../../src/links/http-link'
import { batchPlugin } from '../../src/plugins/batch'
import { transformPlugin } from '../../src/plugins/transform'
import { sleep } from '../../src/utils/sleep'
import { createWsApp } from '../create-ws-app'
import { useApp } from '../setup'

const domain = 'http://localhost:3000'

describe('treaty', () => {
  test('basic HTTP networking works', async () => {
    const data = 'Hello, Elysia'

    const app = new Elysia().get('/', () => data)

    useApp(app)

    const treaty = edenTreaty<typeof app>(domain)

    const result = await treaty.get()

    expect(result.data).toBe(data)
  })

  test('custom path parameter separator works', async () => {
    const id = 'my-post-id'

    const app = new Elysia().get('/posts/:id', (context) => context.params.id)

    useApp(app)

    const treaty = edenTreaty<typeof app>(domain).types({ separator: '||param||' })

    const result = await treaty.posts['||id||'].get({ params: { id } })

    expect(result.data).toBe(id)
  })

  describe('link api works', () => {
    test('http link single request', async () => {
      const data = 'Hello, Elysia'

      const app = new Elysia().get('/', () => data)

      useApp(app)

      const treaty = edenTreaty<typeof app>(domain, { links: [httpLink()] })

      const result = await treaty.get()

      expect(result.data).toBe(data)
    })

    test('http batch link multiple requests', async () => {
      const datas = ['Hello, Elysia', 'Hello, Eden', 'Hello, Aponia']

      let i = 0

      const app = new Elysia().use(batchPlugin({ types: true })).get('/', () => datas[i++])

      useApp(app)

      const treaty = edenTreaty<typeof app>(domain, {
        links: [httpBatchLink({ types: true })],
      })

      const promises = datas.map(() => treaty.get())

      const results = await Promise.all(promises)

      expect(results).toHaveLength(datas.length)

      results.forEach((result, index) => {
        expect(result.data).toBe(datas[index])
      })
    })

    describe('with tranformers', () => {
      test('http link single request', async () => {
        const data = 123n

        const app = new Elysia()
          .use(transformPlugin({ types: true, transformer: SuperJSON }))
          .get('/', () => data)

        useApp(app)

        const treaty = edenTreaty<typeof app>(domain, {
          links: [
            httpLink({
              types: true,
              transformer: SuperJSON,
            }),
          ],
        })

        const result = await treaty.get()

        expect(result.data).toBe(data)
      })

      test('http batch link multiple requests', async () => {
        const datas = Array.from({ length: 5 }, (_, index) => {
          return { value: BigInt(index) }
        })

        let i = 0

        const app = new Elysia()
          .use(transformPlugin({ types: true, transformer: SuperJSON }))
          .use(batchPlugin({ types: true }))
          .get('/', () => datas[i++])

        useApp(app)

        const treaty = edenTreaty<typeof app>(domain, {
          links: [httpBatchLink({ types: true, transformer: SuperJSON })],
        })

        const promises = datas.map(() => treaty.get())

        const results = await Promise.all(promises)

        expect(results).toHaveLength(datas.length)

        results.forEach((result, index) => {
          expect(result.data).toStrictEqual(datas[index])
        })
      })

      test('http batch stream link multiple requests', async () => {
        vi.useFakeTimers()

        const values = Array.from({ length: 5 }, (_, index) => index)

        const interval = 1_000

        let i = 1

        const app = new Elysia()
          .use(transformPlugin({ types: true, transformer: SuperJSON }))
          .use(batchPlugin({ types: true }))
          .get('/', async () => {
            const id = i++

            await sleep(id * interval)

            return id
          })

        useApp(app)

        const treaty = edenTreaty<typeof app>(domain, {
          links: [httpBatchLink({ types: true, transformer: SuperJSON, stream: true })],
        })

        const listener = vi.fn()

        const promises = values.map(() => treaty.get().then(listener))

        for (const value of values) {
          await vi.advanceTimersByTimeAsync(interval)

          expect(listener).toHaveBeenCalledTimes(value + 1)

          expect(listener).toHaveBeenLastCalledWith(
            expect.objectContaining({
              data: value + 1,
            }),
          )
        }

        const results = await Promise.all(promises)

        expect(results).toHaveLength(values.length)

        values.forEach((value) => {
          expect(listener).toHaveBeenNthCalledWith(
            value + 1,
            expect.objectContaining({
              data: value + 1,
            }),
          )
        })

        vi.useRealTimers()
      })
    })
  })

  describe('websockets', () => {
    test('works with path parameters', async () => {
      const clientMessage = 'Hello, WS'

      const params = { userId: 'my-user-id' }

      const serverMessage = params

      const serverListener = vi.fn((ws: ElysiaWS) => {
        ws.send(serverMessage)
      })

      const clientListener = vi.fn()

      const app = createWsApp(domain).ws('/users/:userId', {
        message: serverListener,
      })

      useApp(app)

      const treaty = edenTreaty<typeof app>(domain).types({ separator: '$param' })

      const subscription = treaty.users.$userId.subscribe({ params }, {})

      await subscription.activeConnection.open()

      subscription.subscribe(clientListener)

      subscription.send(clientMessage)

      await vi.waitFor(() =>
        expect(serverListener).toHaveBeenCalledExactlyOnceWith(expect.anything(), clientMessage),
      )

      await vi.waitFor(() =>
        expect(clientListener).toHaveBeenCalledExactlyOnceWith(
          expect.objectContaining({ data: serverMessage }),
        ),
      )
    })
  })

  describe('merges options correctly', () => {
    test('request init', async () => {
      const data = 'Hello, Elysia'

      const app = new Elysia().get('/', () => data)

      useApp(app)

      const fetcher = vi.fn()

      const fetch: RequestInit = {
        credentials: 'include',
        mode: 'no-cors',
        keepalive: true,
      }

      const treaty = edenTreaty<typeof app>(domain, {
        links: [httpLink({ types: true, fetch, fetcher })],
      })

      await treaty.get().catch(() => {})

      expect(fetcher).toHaveBeenCalledExactlyOnceWith(
        expect.anything(),
        expect.objectContaining(fetch),
      )
    })
  })
})

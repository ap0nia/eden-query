import { Elysia } from 'elysia'
import type { ElysiaWS } from 'elysia/ws'
import { describe, expect, test, vi } from 'vitest'

import { edenFetch } from '../../src/eden/fetch'
import { httpBatchLink } from '../../src/links/http-batch-link'
import { httpLink } from '../../src/links/http-link'
import { batchPlugin } from '../../src/plugins/batch'
import { createWsApp } from '../create-ws-app'
import { useApp } from '../setup'

const domain = 'http://localhost:3000'

describe('fetch', () => {
  test('basic HTTP networking works', async () => {
    const data = 'Hello, Elysia'

    const app = new Elysia().get('/', () => data)

    useApp(app)

    const fetch = edenFetch<typeof app>(domain)

    const result = await fetch('')

    expect(result.data).toBe(data)
  })

  test('custom path parameter separator works', async () => {
    const id = 'my-post-id'

    const app = new Elysia().post('/posts/:id', (context) => context.params.id)

    useApp(app)

    const fetch = edenFetch<typeof app>(domain).types({ separator: '||param||' })

    const result = await fetch('/posts/||id||', { method: 'POST', params: { id } })

    expect(result.data).toBe(id)
  })

  describe('link api works', () => {
    test('http link single request', async () => {
      const data = 'Hello, Elysia'

      const app = new Elysia().get('/', () => data)

      useApp(app)

      const fetch = edenFetch<typeof app>(domain, { links: [httpLink()] })

      const result = await fetch('')

      expect(result.data).toBe(data)
    })

    test('http batch link multiple requests', async () => {
      const datas = ['Hello, Elysia', 'Hello, Eden', 'Hello, Aponia']

      let i = 0

      const app = new Elysia().use(batchPlugin({ types: true })).get('/', () => datas[i++])

      useApp(app)

      const fetch = edenFetch<typeof app>(domain, {
        links: [httpBatchLink({ types: true })],
      })

      const promises = datas.map(() => fetch(''))

      const results = await Promise.all(promises)

      expect(results).toHaveLength(datas.length)

      results.forEach((result, index) => {
        expect(result.data).toBe(datas[index])
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

      const fetch = edenFetch<typeof app>(domain).types({ separator: '$param' })

      const subscription = fetch('/users/$userId', { method: 'SUBSCRIBE', params }, {})

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
})

import { batchPlugin } from '@elysiajs/eden-svelte-query'
import { Elysia, t } from 'elysia'
import SuperJSON from 'superjson'

export const app = new Elysia({ prefix: '/api' })
  /**
   * De-serialize incoming JSON data from the client using SuperJSON.
   */
  .onParse(async (context) => {
    if (context.contentType !== 'application/json') return

    const json = await context.request.json()

    return await SuperJSON.deserialize(json)
  })
  /**
   * Serialize outgoing JSON data from the server using SuperJSON.
   */
  .mapResponse((context) => {
    // if (typeof context.response !== 'object') return

    if (context.response instanceof Response) return

    const serializedResponse = SuperJSON.serialize(context.response)

    const text = JSON.stringify(serializedResponse)

    return new Response(text, {
      headers: {
        'Content-Type': 'application/json',
      },
    })
  })
  /**
   * Use the batch plugin after all transforms have been defined so it inherits them.
   */
  .use(batchPlugin())
  .get('/', () => 'Hello, SvelteKit!')
  .get('/bye', () => {
    return 'Goodbye, SvelteKit!'
  })
  .post('/', ({ body }) => body, {
    body: t.Object({
      name: t.String(),
    }),
  })

export type App = typeof app

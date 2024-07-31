import { Elysia, t } from 'elysia'

export const app = new Elysia({ prefix: '/api' })
  .get('/', () => 'hello SvelteKit')
  .post('/', ({ body }) => body, {
    body: t.Object({
      name: t.String(),
    }),
  })

export type App = typeof app

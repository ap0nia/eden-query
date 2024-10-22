import { Elysia, t } from 'elysia'

import { edenPlugin } from '../../../../packages/eden/src/plugins'

const app = new Elysia({ prefix: '/api' })
  .use(edenPlugin({ batch: true }))
  .get('/', () => 'hello Next')
  .post('/', ({ body }) => body, {
    body: t.Object({
      name: t.String(),
    }),
  })

export const GET = app.handle
export const POST = app.handle

export type App = typeof app

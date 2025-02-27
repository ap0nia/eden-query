import { Elysia, t } from 'elysia'

const data: Record<string, unknown> = {}

const app = new Elysia()
  .get('/', () => {
    return 'Hello, Elysia'
  })
  .get('/id/:id', ({ params: { id } }) => {
    return data[id]
  })
  .post(
    '/id/:id',
    async ({ body, params: { id } }) => {
      data[id] = body

      return data[id]
    },
    {
      body: t.Object({
        id: t.Number(),
        name: t.String(),
      }),
    },
  )
  .delete('/id/:id', async ({ params: { id } }) => {
    delete data[id]
  })

import { createEdenTreatySvelteQuery } from '@ap0nia/eden-svelte-query'

export const eden = createEdenTreatySvelteQuery<typeof app>()

eden.index

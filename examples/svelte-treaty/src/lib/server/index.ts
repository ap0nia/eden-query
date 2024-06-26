import { t } from 'elysia'

import { elysia } from './setup'

/**
 * Demonstration database.
 */
const db = {
  count: 0,
}

export const app = elysia
  .get('/', () => {
    return 'Hello, World!'
  })
  .get('/count', () => {
    return db.count
  })
  .delete('/count', () => {
    db.count = 0
    return db.count
  })
  .get('/wait', async () => {
    await new Promise((resolve) => setTimeout(resolve, 5000))
    return 'OK'
  })
  .put(
    '/count',
    (context) => {
      const increment = context.body.increment ?? 1
      db.count += increment
      return increment
    },
    {
      body: t.Object({
        increment: t.Optional(t.Number()),
      }),
    },
  )

export type App = typeof app

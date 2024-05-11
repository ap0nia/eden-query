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
  .put(
    '/count',
    (context) => {
      const increment = context.query.increment ?? 1
      db.count += increment
      return increment
    },
    {
      query: t.Object({
        increment: t.Optional(t.Number()),
      }),
    },
  )

export type App = typeof app

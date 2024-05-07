import { Elysia, t } from 'elysia'
import { describe, test } from 'vitest'

import { createEdenFetchQuery } from '../../src/fetch'

describe('fetch', () => {
  test('can distinguish between same route and different mutation methods', () => {
    const elysia = new Elysia()
      .post(
        '/',
        async () => {
          return 'HELLO, WORLD'
        },
        {
          body: t.Object({
            hello: t.String(),
          }),
        },
      )
      .delete(
        '/',
        async () => {
          return 12345
        },
        {
          body: t.Object({
            goodbye: t.String(),
          }),
        },
      )

    const eden = createEdenFetchQuery<typeof elysia>()

    // When creating the mutation, its types are ambiguous because the method is 'POST' | 'delete'
    const mutation = eden.createMutation('/index', {})

    mutation.subscribe(($mutation) => {
      // Strongly define the type of this mutation as the 'POST' version.
      $mutation.mutateAsync({
        method: 'POST',
        body: {
          // @ts-expect-error It should detect that this is an invalid type for POST version.
          goodbye: '',
        },
      })

      // Same as POST version above, but with valid body.
      $mutation.mutateAsync({
        method: 'POST',
        body: {
          hello: '',
        },
      })

      // Strongly define the type of this mutation as the 'DELETE' version.
      $mutation.mutateAsync({
        method: 'DELETE',
        body: {
          // @ts-expect-error It should detect that this is an invalid type for DELETE version.
          hello: '',
        },
      })

      // Same as DELETE version above, but with valid body.
      $mutation.mutateAsync({
        method: 'DELETE',
        body: {
          goodbye: '',
        },
      })
    })
  })
})

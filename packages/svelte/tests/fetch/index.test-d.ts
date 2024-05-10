import { Elysia, t } from 'elysia'
import { describe, test } from 'vitest'

import { createEdenTreatyQuery } from '../../src'
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
      .get('/a/b/:cursor', async () => {
        return 12345
      })

    const eden = createEdenFetchQuery<typeof elysia>()

    const utils = eden.getContext()

    // Partial route used for invalidation key only accepts two arguments.
    utils.invalidate('/a', { cancelRefetch: true })

    // Full route used  for invalidate takes three arguments.
    utils.invalidate('/a/b/:cursor', { params: { cursor: '' } }, { cancelRefetch: true })

    eden.createInfiniteQuery('/a/b/:cursor', { queryOptions: {} as any, params: {} })

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

  test('infinite', () => {
    const elysia = new Elysia().get('/hello', () => 123).get('/hello/:cursor', () => true)

    const eden = createEdenFetchQuery<typeof elysia>()

    eden.createInfiniteQuery('/hello/:cursor', {
      params: {},
      queryOptions: {} as any,
    })
  })

  test('treaty', () => {
    const elysia = new Elysia().get('/hello', () => 123).get('/hello/:cursor', () => true)

    const eden = createEdenTreatyQuery<typeof elysia>()

    const utils = eden.getContext()

    utils.hello[':cursor']

    eden.hello[':cursor'].get.createInfiniteQuery
  })
})

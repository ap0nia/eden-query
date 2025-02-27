/* eslint-disable */

// testing area for types

import { Elysia, t } from 'elysia'

const postSchema = t.Object({
  id: t.String(),
  message: t.String(),
})

let prisma: any

postSchema.static

const data: Record<string, unknown> = {}

const app = new Elysia()
  .get('/posts', async () => {
    return data
  })
  .get('/posts/:id', async ({ params: { id } }) => {
    return data[id]
  })
  .post(
    '/posts/:id',
    async ({ body, params: { id } }) => {
      data[id] = body
      return data[id]
    },
    {
      body: postSchema,
    },
  )
  .delete('/posts/:id', async ({ params: { id } }) => {
    delete data[id]
  })
  .get(
    '/infinitePosts',
    async (context) => {
      const input = context.query

      const limit = input.limit ?? 50

      const { cursor } = input

      const items = await prisma.post.findMany({
        take: limit + 1, // get an extra item at the end which we'll use as next cursor
        where: {
          title: {
            contains: 'Prisma' /* Optional filter */,
          },
        },
        cursor: cursor ? { myCursor: cursor } : undefined,
        orderBy: {
          myCursor: 'asc',
        },
      })

      let nextCursor: typeof cursor | undefined = undefined

      if (items.length > limit) {
        const nextItem = items.pop()
        nextCursor = nextItem!.myCursor
      }

      return { items, nextCursor }
    },
    {
      query: t.Object({
        limit: t.Optional(t.Number({ min: 1, max: 100 })),
        cursor: t.Optional(t.Any()), // <-- "cursor" needs to exist on either the query or params, but can be any type
        direction: t.Union([t.Const('forward'), t.Const('backward')]), // optional, useful for bi-directional query
      }),
    },
  )
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

import { createEdenTreatySvelteQuery, getQueryKey } from '@ap0nia/eden-svelte-query'

export const eden = createEdenTreatySvelteQuery<typeof app>()

eden.getUtils().infinitePosts.get.getInfiniteData()

const a = eden.createQueries((e) => {
  return [e.posts({ id: '' }).get({})]
})
a.subscribe((s) => s[0].refetch)

import { createQueries, skipToken, useIsFetching, useQueryClient } from '@tanstack/svelte-query'
const b = createQueries()
b.subscribe((s) => s[0]?.refetch)

const postListKey = getQueryKey(eden.posts, undefined, 'query')

useIsFetching({ queryKey: postListKey })
const queryClient = useQueryClient()
queryClient.setQueryDefaults(postListKey, {})

eden.posts({ id: '' }).get.createQuery(undefined, {
  eden: {
    abortOnUnmount: true,
  },
})

eden.posts.get.createQuery(skipToken)

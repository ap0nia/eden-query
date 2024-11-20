---
title: useInfiniteQuery Eden-React-Query - ElysiaJS
head:
  - - meta
    - property: 'og:title'
      content: useInfiniteQuery Eden-React-Query - ElysiaJS

  - - meta
    - name: 'description'
      content: useInfiniteQuery Eden-React-Query - ElysiaJS

  - - meta
    - property: 'og:description'
      content: useInfiniteQuery Eden-React-Query - ElysiaJS
---

# useInfiniteQuery

:::info

- Your procedure needs to accept a `cursor` input of any type (`string`, `number`, etc) to expose this hook.
- For more details on infinite queries read the [react-query docs](https://tanstack.com/query/v5/docs/framework/react/reference/useInfiniteQuery)
- In this example we're using Prisma - see their docs on [cursor-based pagination](https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination)

:::

## Example Procedure

### Elysia Server Application

::: code-group

```typescript twoslash include eq-react-useInfiniteQuery-application [server.ts]
import { Elysia, t } from 'elysia'
import { batchPlugin } from '@ap0nia/eden-react-query/server'

let prisma: any

type Item = {
  status: string
  myCursor: any
}

export const app = new Elysia()
  .use(batchPlugin())
  .get(
    '/infinitePosts',
    async (context) => {
      const input = context.query

      const limit = input.limit ?? 50

      const { cursor } = input

      const items: Item[] = await prisma.post.findMany({
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
  .post('/infinitePosts', () => {
    console.log('post infinite posts')
  })
  .delete('/infinitePosts', () => {
    console.log('delete infinite posts')
  })

export type App = typeof app
```

:::

### Eden-Query Client

::: code-group

```typescript twoslash
// @filename: server.ts
// ---cut---
// @include: eq-react-useInfiniteQuery-application

// @filename: eden.ts
// ---cut---
import { createEdenTreatyReactQuery } from '@ap0nia/eden-react-query'
import type { App } from './server'

export const eden = createEdenTreatyReactQuery<App>()
```

:::

### React Component

::: code-group

```typescript twoslash [index.tsx]
// @filename: server.ts
// ---cut---
// @include: eq-react-useInfiniteQuery-application

// @filename: eden.ts
// ---cut---
import { createEdenTreatyReactQuery } from '@ap0nia/eden-react-query'
import type { App } from './server'

export const eden = createEdenTreatyReactQuery<App>()

// @filename: index.tsx
// ---cut---
import React from 'react'
import { eden } from './eden'

export function MyComponent() {
  const myQuery = eden.infinitePosts.get.useInfiniteQuery(
    { limit: 10 },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      // initialCursor: 1, // <-- optional you can pass an initialCursor
    },
  )
  // [...]
}
```

:::

## Helpers

### `getInfiniteData()`

This helper gets the currently cached data from an existing infinite query

::: code-group

```typescript twoslash [index.tsx]
// @filename: server.ts
// ---cut---
// @include: eq-react-useInfiniteQuery-application

// @filename: eden.ts
// ---cut---
import { createEdenTreatyReactQuery } from '@ap0nia/eden-react-query'
import type { App } from './server'

export const eden = createEdenTreatyReactQuery<App>()

// @filename: index.tsx
// ---cut---
import React from 'react'
import { eden } from './eden'

export function MyComponent() {
  const utils = eden.useUtils()

  const myMutation = eden.infinitePosts.post.useMutation({
    async onMutate(opts) {
      await utils.infinitePosts.get.cancel()
      const allPosts = utils.infinitePosts.get.getInfiniteData({ limit: 10  })
      // [...]
    },
  })
}
```

:::

### `setInfiniteData()`

This helper allows you to update a query's cached data

::: code-group

```typescript twoslash [index.tsx]
// @filename: server.ts
// ---cut---
// @include: eq-react-useInfiniteQuery-application

// @filename: eden.ts
// ---cut---
import { createEdenTreatyReactQuery } from '@ap0nia/eden-react-query'
import type { App } from './server'

export const eden = createEdenTreatyReactQuery<App>()

// @filename: index.tsx
// ---cut---
import React from 'react'
import { eden } from './eden'

export function MyComponent() {
  const utils = eden.useUtils()

  const myMutation = eden.infinitePosts.delete.useMutation({
    async onMutate(opts) {
      // await utils.infinitePosts.cancel()

      utils.infinitePosts.get.setInfiniteData({ limit: 10 }, (data) => {
        if (!data) {
          return {
            pages: [],
            pageParams: [],
          }
        }

        return {
          ...data,
          pages: data.pages.map((page) => ({
            ...page,
            items: page.items.filter((item) => item.status === 'published'),
          })),
        }
      })
    },
  })
}
```

:::

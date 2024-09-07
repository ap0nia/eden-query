---
title: Suspense Eden-React-Query - ElysiaJS
head:
  - - meta
    - property: 'og:title'
      content: Suspense Eden-React-Query - ElysiaJS

  - - meta
    - name: 'description'
      content: Suspense Eden-React-Query - ElysiaJS

  - - meta
    - property: 'og:description'
      content: Suspense Eden-React-Query - ElysiaJS
---

# Suspense

:::info

- Ensure you're on the latest version of React
- If you use suspense with [eden's _automatic_ SSR in Next.js](../nextjs/ssr),
  the full page will crash on the server if a query fails, even if you have an `<ErrorBoundary />`

:::

## Usage

:::tip

`useSuspenseQuery` & `useSuspenseInfiniteQuery` both return a `[data, query]`-_tuple_,
to make it easy to directly use your data and renaming the variable to something descriptive.

:::

### Elysia Server Application

::: code-group

```typescript twoslash include eq-react-suspense-application [server.ts]
import { Elysia, t } from 'elysia'
import { batchPlugin } from '@ap0nia/eden-react-query'

const posts = [
  { id: '1', title: 'everlong' },
  { id: '2', title: 'After Dark' },
]

export const app = new Elysia()
  .use(batchPlugin())
  .get(
    '/post/all',
    (context) => {
      return {
        posts,
        nextCursor: '123' as string | undefined,
      }
    },
    {
      query: t.Object({
        cursor: t.Optional(t.Any()),
      }),
    },
  )
  .get('/post/:id', (context) => {
    const post = posts.find((p) => p.id === context.params.id)

    if (!post) {
      throw new Error('NOT_FOUND')
      // TODO: EdenError
      // throw new EdenError({ code: 'NOT_FOUND' })
    }

    return post
  })

export type App = typeof app
```

:::

### Eden-Query Client

::: code-group

```typescript twoslash [eden.ts]
// @filename: server.ts
// ---cut---
// @include: eq-react-suspense-application

// @filename: eden.ts
// ---cut---
import { createEdenTreatyReactQuery } from '@ap0nia/eden-react-query'
import type { App } from './server'

export const eden = createEdenTreatyReactQuery<App>()
```

:::

### `useSuspenseQuery()`

::: code-group

```typescript twoslash [index.tsx]
// @filename: server.ts
// ---cut---
// @include: eq-react-suspense-application

// @filename: eden.ts
// ---cut---
import { createEdenTreatyReactQuery } from '@ap0nia/eden-react-query'
import type { App } from './server'

export const eden = createEdenTreatyReactQuery<App>()

// @filename: index.tsx
// ---cut---
// @noErrors
import React from 'react'
import { eden } from './eden'

function PostView() {
  const [post, postQuery] = eden.post({ id: 1 }).get.useSuspenseQuery()

  return <>{/* ... */}</>
}
```

:::

### `useSuspenseInfiniteQuery()`

::: code-group

```typescript twoslash [index.ts]
// @filename: server.ts
// ---cut---
// @include: eq-react-suspense-application

// @filename: eden.ts
// ---cut---
import { createEdenTreatyReactQuery } from '@ap0nia/eden-react-query'
import type { App } from './server'

export const eden = createEdenTreatyReactQuery<App>()

// @filename: index.tsx
// ---cut---
import React from 'react'
import { eden } from './eden'

function PostView() {
  const [{ pages }, allPostsQuery] = eden.post.all.get.useSuspenseInfiniteQuery(
    //      ^?
    undefined,
    {
      getNextPageParam(lastPage) {
        return lastPage.nextCursor
      },
    },
  )

  const { isFetching, isFetchingNextPage, fetchNextPage, hasNextPage } = allPostsQuery

  return /* ... */
}
```

:::

### `useSuspenseQueries()`

Suspense equivalent of [`useQueries()`](./useQueries.md).

::: code-group

```typescript twoslash [index.tsx]
// @filename: server.ts
// ---cut---
// @include: eq-react-suspense-application

// @filename: eden.ts
// ---cut---
import { createEdenTreatyReactQuery } from '@ap0nia/eden-react-query'
import type { App } from './server'

export const eden = createEdenTreatyReactQuery<App>()

// @filename: index.tsx
// ---cut---
import React from 'react'
import { eden } from './eden'

export type PostViewProps = {
  postIds: string[]
}

function PostView(props: PostViewProps) {
  const [posts, postQueries] = eden.useSuspenseQueries((e) => {
    return props.postIds.map((id) => e.post({ id }).get())
  })
  return /* */
}
```

:::

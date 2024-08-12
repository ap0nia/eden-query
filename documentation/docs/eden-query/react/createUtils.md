---
title: createUtils Eden-React-Query - ElysiaJS
head:
  - - meta
    - property: 'og:title'
      content: createUtils Eden-React-Query - ElysiaJS

  - - meta
    - name: 'description'
      content: createUtils Eden-React-Query - ElysiaJS

  - - meta
    - property: 'og:description'
      content: createUtils Eden-React-Query - ElysiaJS
---

# createUtils

Similar to `useUtils`, `createUtils` is a method on the root proxy that gives you access
to helpers that let you manage the cached data of the queries you execute via `@ap0nia/eden-react-query`.
These helpers are actually thin wrappers around
`@tanstack/react-query`'s [`queryClient`](https://tanstack.com/query/v5/docs/reference/QueryClient) methods. If you want more in-depth information about options and usage patterns for `useUtils` helpers than what we provide here, we will link to their respective `@tanstack/react-query` docs so you can refer to them accordingly.

:::tip

The difference between `useUtils` and `createUtils` is that `useUtils` is a react hook that uses `useQueryClient` under the hood.
This means that it is intended to be used within React Components.
The use case for `createUtils` is when you need to use the helpers outside of a React Component,
for example in react-router's loaders.

:::

:::warning

You should avoid using `createTRPCQueryUtils` in React Components. Instead, use `useUtils` which is a React hook that implements `useCallback` and `useQueryClient` under the hood.

:::

## Usage

<template>

```typescript twoslash include react-createUtils-application
import { Elysia, t } from 'elysia'
import { batchPlugin } from '@ap0nia/eden-react-query'

export const app = new Elysia().use(batchPlugin()).get('/post/all', (context) => {
  return {
    posts: [
      { id: 1, title: 'everlong' },
      { id: 2, title: 'After Dark' },
    ],
  }
})

export type App = typeof app
```

```typescript twoslash include react-createUtils-eden
// @noErrors
import { createEdenTreatyReactQuery, httpBatchLink } from '@ap0nia/eden-react-query'
import type { App } from '../server'

export const eden = createEdenTreatyReactQuery<App>()

export const client = eden.createClient({
  links: [
    httpBatchLink({
      domain: 'http://localhost:3000',
    }),
  ],
})
```

</template>

`createUtils` returns an object that looks like `useUtils` --
with all the available queries you have in your routers.
You use it the same way as your `eden` utils object.
Once you reach a query, you'll have access to the query helpers.

In our component, when we navigate, we use the object `createUtils` gives us and
in order to prefetch the `post.all` query.
In addition, we have access to all our query helpers!

::: code-group

```typescript twoslash [src/pages/MyPage.tsx]
// @filename: src/server.ts
// @include: react-createUtils-application

// @filename: src/lib/eden.ts
// ---cut---
// @include: react-createUtils-eden

// @filename: src/pages/MyPage.tsx
// ---cut---
// @noErrors
import React from 'react'
import { useLoaderData } from 'react-router-dom'
import { eden, client } from '../lib/eden'

const queryClient = new QueryClient()

const clientUtils = eden.createUtils({ queryClient, client })

export async function loader() {
  const allPostsData = await clientUtils.post.all.get.ensureData() // Fetches data if it doesn't exist in the cache

  return {
    allPostsData,
  }
}

// This is a react component
export function Component() {
  const loaderData = useLoaderData() as Awaited<ReturnType<typeof loader>>

  const allPostQuery = trpc.post.all.useQuery({
    initialData: loaderData.allPostsData, // Uses the data from the loader
  })

  return (
    <div>
      {allPostQuery.data.posts.map((post) => (
        <div key={post.id}>{post.title}</div>
      ))}
    </div>
  )
}
```

```typescript twoslash [src/lib/eden.ts]
// @filename: src/server.ts
// @include: react-createUtils-application

// @filename: src/lib/eden.ts
// ---cut---
// @include: react-createUtils-eden
```

```typescript twoslash [src/server.ts]
// @include: react-createUtils-application
```

:::

:::warning

If you were using Remix Run, SSR, e.g. Next.js, SvelteKit, etc. **_do not re-use_** the same `queryClient` for every request.
This may lead to cross-request data leakage. Instead, create a new `queryClient` for every request so that .

:::

## Helpers

Much like `useUtils`, `createUtils` gives you access to same set of helpers.
The only difference is that you need to pass in the `queryClient` and `client` objects.

You can see them on the [useUtils](./useUtils) page.
---
title: useQueries Eden-React-Query - ElysiaJS
head:
  - - meta
    - property: 'og:title'
      content: useQueries Eden-React-Query - ElysiaJS

  - - meta
    - name: 'description'
      content: useQueries Eden-React-Query - ElysiaJS

  - - meta
    - property: 'og:description'
      content: useQueries Eden-React-Query - ElysiaJS
---

# useQueries

The `useQueries` hook can be used to fetch a variable number of queries at the same time using only one hook call.

The main use case for such a hook is to be able to fetch a number of queries,
usually of the same type. For example if you fetch a list of todo ids, you can then map over them in a useQueries hook calling a byId endpoint that would fetch the details of each todo.

:::info
While fetching multiple types in a `useQueries` hook is possible,
there is not much of an advantage compared to using multiple `useQuery` calls
unless you use the `suspense` option as that `useQueries` can trigger suspense in parallel
while multiple `useQuery` calls would waterfall.
:::

## Usage

The useQueries hook is the same as that of
[@tanstack/query useQueries](https://tanstack.com/query/v5/docs/framework/react/reference/useQueries).
The only difference is that you pass in a function that returns an array of queries instead of an array of queries inside an object parameter.

:::tip
When you're using the [`httpBatchLink`](/docs/client/links/httpBatchLink) or [`wsLink`](/docs/client/links/wsLink),
the below will end up being only 1 HTTP call to your server.
Additionally, if the underlying procedure is using something like Prisma's `findUnique()` it will
[automatically batch](https://www.prisma.io/docs/guides/performance-and-optimization/query-optimization-performance#solving-n1-in-graphql-with-findunique-and-prismas-dataloader)
& do exactly 1 database query as well.
:::

### Elysia Server Application

::: code-group

```typescript twoslash include eq-react-useQueries-application [server.ts]
import { Elysia, t } from 'elysia'
import { batchPlugin } from '@ap0nia/eden-react-query'

export const app = new Elysia()
  .use(batchPlugin())
  .get('/post/:id', (context) => {
    return {
      id: context.params.id,
      title: 'Look me up!',
    }
  })
  .get(
    '/greeting',
    (context) => {
      return {
        message: `hello ${context.query?.text ?? 'world'}`,
      }
    },
    {
      query: t.Object({
        text: t.Optional(t.String()),
      }),
    },
  )

export type App = typeof app
```

:::

::: code-group

```typescript twoslash [eden.ts]
// @filename: server.ts
// ---cut---
// @include: eq-react-useQueries-application

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
// @include: eq-react-useQueries-application

// @filename: eden.ts
// ---cut---
import { createEdenTreatyReactQuery } from '@ap0nia/eden-react-query'
import type { App } from './server'

export const eden = createEdenTreatyReactQuery<App>()

// @filename: index.tsx
// ---cut---
import React from 'react'
import { eden } from './eden'

export type MyProps = {
  postIds: string[]
}

export function MyComponent(props: MyProps) {
  const postQueries = eden.useQueries((e) => {
    return props.postIds.map((id) => e.post({ id }).get())
  })

  return /* [...] */
}
```

:::

### Providing options to individual queries

You can also pass in any normal query options to the second parameter of any of the query calls in the array such as `enabled`, `suspense`, `refetchOnWindowFocus`...etc. For a complete overview of all the available options, see the [tanstack useQuery](https://tanstack.com/query/v5/docs/framework/react/reference/useQuery) documentation.

::: code-group

```typescript twoslash [index.tsx]
// @filename: server.ts
// ---cut---
// @include: eq-react-useQueries-application

// @filename: eden.ts
// ---cut---
import { createEdenTreatyReactQuery } from '@ap0nia/eden-react-query'
import type { App } from './server'

export const eden = createEdenTreatyReactQuery<App>()

// @filename: index.tsx
// ---cut---
import React from 'react'
import { eden } from './eden'

export type MyProps = {
  postIds: string[]
}

export function MyComponent(props: MyProps) {
  const [post, greeting] = eden.useQueries((e) => [
    e.post({ id: 1 }).get(undefined, { enabled: false }),
    e.greeting.get({ text: 'world' }),
  ])

  const onButtonClick = () => {
    post.refetch()
  }

  return (
    <div>
      <h1>{post.data && post.data.title}</h1>
      <p>{greeting.data?.message}</p>
      <button onClick={onButtonClick}>Click to fetch</button>
    </div>
  )
}
```

:::

### Context

You can also pass in an optional React Query context to override the default.

::: warning
This is actually false, I'm not sure why this is on the documentation...
:::

::: code-group

```typescript [index.tsx]
import { eden } from './eden'

export type MyProps = {
  postIds: string[]
}

export function MyComponent(props: MyProps) {
  const [post, greeting] = eden.useQueries(
    (e) => [
      e.post({ id: 1 }).get(),
      e.greeting.get({ text: 'world' }),
    ],
    myCustomContext,
  )
}
```

:::

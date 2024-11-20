---
title: Eden-React-Query - ElysiaJS
head:
  - - meta
    - property: 'og:title'
      content: Eden-React-Query - ElysiaJS

  - - meta
    - name: 'description'
      content: Eden-React-Query - ElysiaJS

  - - meta
    - property: 'og:description'
      content: Eden-React-Query - ElysiaJS
---

# Eden-React-Query

Eden-React-Query offers a first class integration with React.
Under the hood this is simply a wrapper around the very popular [@tanstack/react-query](https://tanstack.com/query/latest),
so we recommend that you familiarise yourself with React Query,
as their docs go in to much greater depth on its usage.

:::tip
If you are using Next.js we recommend using [our integration with that](../nextjs) instead
(WIP)
:::

### The Eden React Query Integration

#### Elysia Server Application

::: code-group

```typescript twoslash include eq-react-index-application [server.ts]
import { Elysia, t } from 'elysia'
import { batchPlugin } from '@ap0nia/eden-react-query/server'

export const app = new Elysia()
  .use(batchPlugin())
  .get(
    '/hello',
    (context) => {
      return { greeting: `Hello, ${context.query.name}!` }
    },
    {
      query: t.Object({
        name: t.String(),
      }),
    },
  )
  .post('/goodbye', () => {
    console.log('Goodbye!')
  })

export type App = typeof app
```

:::

#### Eden-Query Client Setup

::: code-group

```typescript twoslash include eq-react-index-client [eden.ts]
// @noErrors
import { createEdenTreatyReactQuery, httpBatchLink } from '@ap0nia/eden-react-query'
import type { App } from './server'

export const eden = createEdenTreatyReactQuery<App>()

export const client = eden.createClient({
  links: [
    httpBatchLink({
      domain: 'http://localhost:3000',
    }),
  ],
})
```

:::

This library enables usage directly within React components.

::: code-group

```typescript twoslash [index.tsx]
// @filename: server.ts
// @include: eq-react-index-application

// @filename: eden.ts
// @include: eq-react-index-client

// @filename: index.tsx
// ---cut---
import React from 'react'
import { eden } from './eden'

export default function IndexPage() {
  const helloQuery = eden.hello.get.useQuery({ name: 'Bob' })
  const goodbyeMutation = eden.goodbye.post.useMutation()

  return (
    <div>
      <p>{helloQuery.data?.greeting}</p>
      <button onClick={() => goodbyeMutation.mutate()}>Say Goodbye</button>
    </div>
  )
}
```

:::

### Differences to vanilla React Query

The wrapper abstracts some aspects of React Query for you:

- Query Keys - these are generated and managed by eden on your behalf, based on the procedure inputs you provide.
  - If you need the query key which eden calculates, you can use [getQueryKey](./getQueryKey).
- Type safe by default - the types you provide in your Elysia Backend also drive the types of your React Query client,
  providing safety throughout your React app.

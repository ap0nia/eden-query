---
title: Setup Eden-React-Query - ElysiaJS
head:
  - - meta
    - property: 'og:title'
      content: Setup Eden-React-Query - ElysiaJS

  - - meta
    - name: 'description'
      content: Setup Eden-React-Query - ElysiaJS

  - - meta
    - property: 'og:description'
      content: Setup Eden-React-Query - ElysiaJS
---

# Setup

### 1. Install dependencies

```sh npm2yarn
npm install elysia @ap0nia/eden-react-query @tanstack/react-query
```

### 2. Create Elysia server application

::: code-group

```typescript twoslash include eq-react-setup-application [server.ts]
import { Elysia, t } from 'elysia'
import { edenPlugin } from '@ap0nia/eden-react-query/server'

const users = [
  {
    id: 'id_bilbo',
    name: 'bilbo',
  },
]

export const app = new Elysia()
  .use(edenPlugin({ batch: true }))
  .get('/', () => 'Hello, World!')
  .get(
    '/user',
    (context) => {
      return users.find((user) => user.id === context.query.id)
    },
    {
      query: t.Object({
        id: t.String(),
      }),
    },
  )
  .post(
    '/user',
    (context) => {
      const newUser = {
        id: `id_${context.body.name}`,
        name: context.body.name,
      }

      users.push(newUser)

      return users
    },
    {
      body: t.Object({
        name: t.String(),
      }),
    },
  )

export type App = typeof app
```

:::

### 3. Create eden-treaty hooks

Create a set of strongly-typed React hooks from your `App` type signature with `createEdenTreatyReactQuery`.

::: code-group

```typescript twoslash include eq-react-setup-client [eden.ts]
// @filename: server.ts
// ---cut---
// @include: eq-react-setup-application

// @filename: eden.ts
// ---cut---
import { createEdenTreatyReactQuery } from '@ap0nia/eden-react-query'
import type { App } from './server'

export const eden = createEdenTreatyReactQuery<App>()
```

:::

### 4. Add eden providers

Create an Eden client, and wrap your application in the Eden Provider, as below.
You will also need to set up and connect React-Query,
which [is documented here in more depth](https://tanstack.com/query/latest/docs/framework/react/quick-start).

:::tip
If you already use React Query in your application,
you **should** re-use the `QueryClient` and `QueryClientProvider` you already have.
:::

::: code-group

```typescript twoslash [index.tsx]
// @filename: server.ts
// ---cut---
// @include: eq-react-setup-application

// @filename: eden.ts
// ---cut---
import { createEdenTreatyReactQuery } from '@ap0nia/eden-react-query'
import type { App } from './server'

export const eden = createEdenTreatyReactQuery<App>()

// @filename: index.tsx
// ---cut---
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { httpBatchLink } from '@ap0nia/eden-react-query'
import React, { useState } from 'react'
import { eden } from './eden'

function getAuthCookie() {
  return undefined
}

export function App() {
  const [queryClient] = useState(() => new QueryClient())

  const [edenClient] = useState(() =>
    eden.createClient({
      links: [
        httpBatchLink({
          domain: 'http://localhost:3000/eden',

          // You can pass any HTTP headers you wish here
          async headers() {
            return {
              authorization: getAuthCookie(),
            }
          },
        }),
      ],
    }),
  )

  return (
    <eden.Provider client={edenClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{/* Your app here */}</QueryClientProvider>
    </eden.Provider>
  )
}
```

:::

:::info
The reason for using `useState` in the creation of the `queryClient` and the `TRPCClient`,
as opposed to declaring them outside of the component, is to ensure that each request gets a unique client when using SSR.
If you use client side rendering then you can move them if you wish.
:::

#### 5. Fetch data

You can now use the eden-treaty React Query integration to call queries and mutations on your API.

::: code-group

```typescript twoslash[page.tsx]
// @filename: server.ts
// ---cut---
// @include: eq-react-setup-application

// @filename: eden.ts
// ---cut---
import { createEdenTreatyReactQuery } from '@ap0nia/eden-react-query'
import type { App } from './server'

export const eden = createEdenTreatyReactQuery<App>()

// @filename: page.tsx
// ---cut---
import React from 'react'
import { eden } from './eden'

export default function IndexPage() {
  const userQuery = eden.user.get.useQuery({ id: 'id_bilbo' })
  const userCreator = eden.user.post.useMutation()

  return (
    <div>
      <p>{userQuery.data?.name}</p>

      <button onClick={() => userCreator.mutate({ name: 'Frodo' })}>Create Frodo</button>
    </div>
  )
}
```

:::

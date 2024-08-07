---
title: React-Query + Eden - ElysiaJS
head:
  - - meta
    - property: 'og:title'
      content: End-to-End Type Safety with React-Query - ElysiaJS

  - - meta
    - name: 'description'
      content: Integration between Eden and React-Query.

  - - meta
    - property: 'og:description'
      content: Integration between Eden and React-Query.
---

# Introduction

The goal of eden + react-query is to provide a similar interface to
[tRPC's react-query integration](https://trpc.io/docs/client/react),
while supporting all the functionality provided by the
[official Eden implementation](https://elysiajs.com/eden/overview.html).

## React Example

> View a full example [here](https://github.com/ap0nia/eden-query/tree/main/examples/eden-react-query-basic)

2. Create the elysia application.

```typescript twoslash
import { Elysia, t } from 'elysia'

new Elysia()
  .post(
    '/profile',
    // ↓ hover me ↓
    ({ body }) => body,
    {
      body: t.Object({
        username: t.String(),
      }),
    },
  )
  .listen(3000)
```

3. Initialize the eden-treaty-query client.

```typescript twoslash
// @filename: server.ts
import { Elysia, t } from 'elysia'

export const app = new Elysia().get('/', () => 'Hello, World!')

export type App = typeof app

// @filename: src/lib/eden.ts
// ---cut---
import {
  createEdenTreatyQuery,
  type InferTreatyQueryInput,
  type InferTreatyQueryOutput,
} from '@elysiajs/eden-react-query'

import type { App } from '../../server'

export const eden = createEdenTreatyQuery<App>({ abortOnUnmount: true })

export type InferInput = InferTreatyQueryInput<App>

export type InferOutput = InferTreatyQueryOutput<App>
```

4. Setup the providers

```typescript twoslash
// @filename: server.ts
import { Elysia, t } from 'elysia'

export const app = new Elysia().get('/', () => 'Hello, World!')

export type App = typeof app

// @filename: src/lib/eden.ts
// ---cut---
import {
  createEdenTreatyQuery,
  type InferTreatyQueryInput,
  type InferTreatyQueryOutput,
} from '@elysiajs/eden-react-query'

import type { App } from '../../server'

export const eden = createEdenTreatyQuery<App>({ abortOnUnmount: true })

export type InferInput = InferTreatyQueryInput<App>

export type InferOutput = InferTreatyQueryOutput<App>

// @filename: src/App.tsx
// ---cut---
import React from 'react'
import { useState } from 'react'
import { httpBatchLink } from '@elysiajs/eden-react-query'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { eden } from './lib/eden'

function getAuthCookie() {
  // do something...
  return undefined
}

export function App() {
  const [queryClient] = useState(() => new QueryClient())

  const [trpcClient] = useState(() =>
    eden.createClient({
      links: [
        httpBatchLink({
          domain: 'http://localhost:3000/trpc',

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
    <eden.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{/* Your app here */}</QueryClientProvider>
    </eden.Provider>
  )
}
```

5. Fetch data

```typescript twoslash
// @filename: server.ts
import { Elysia, t } from 'elysia'

const users: string[] = []

export const app = new Elysia()
  .get(
    '/getUser',
    (context) => {
      return {
        name: `User is ${context.query.id}`
      }
    },
    {
      query: t.Object({
        id: t.String()
      })
    })
  .post(
    '/createUser',
    (context) => {
      users.push(context.body.name)
      return users
    },
    {
      body: t.Object({
        name: t.String()
      })
    })

export type App = typeof app

// @filename: src/lib/eden.ts
// ---cut---
import {
  createEdenTreatyQuery,
  type InferTreatyQueryInput,
  type InferTreatyQueryOutput,
} from '@elysiajs/eden-react-query'

import type { App } from '../../server'

export const eden = createEdenTreatyQuery<App>({ abortOnUnmount: true })

export type InferInput = InferTreatyQueryInput<App>

export type InferOutput = InferTreatyQueryOutput<App>

// @filename: src/pages/index.tsx
// ---cut---
import React from 'react'
import { eden } from '../lib/eden'

export default function Page() {
  const userQuery = eden.getUser.get.useQuery({ query: { id: 'Elysia' }})

  const userCreator = eden.createUser.post.useMutation()

  return (
    <div>
      <p>{userQuery.data?.name}</p>

      <button onClick={() => userCreator.mutate({ name: 'Frodo' })}>
        Create Frodo
      </button>
    </div>
  )
}
```

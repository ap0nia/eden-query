---
title: Eden-Query - ElysiaJS
head:
  - - meta
    - property: 'og:title'
      content: Eden-Query - ElysiaJS

  - - meta
    - name: 'description'
      content: Eden-Query is a type-safe Elysia.js client with the powerful asynchronous state management of tanstack-query.

  - - meta
    - property: 'og:description'
      content: Eden-Query is a type-safe Elysia.js client with the powerful asynchronous state management of tanstack-query.
---

<script setup>
    import Card from '../../src/components/nearl/card.vue'
    import Deck from '../../src/components/nearl/card-deck.vue'
</script>

# Eden-Query Introduction

Eden-Query combines the official type-safe [Eden client for Elysia.js](https://elysiajs.com/eden/overview.html)
with powerful asynchronous state management from [tanstack-query](https://tanstack.com/query/latest).

Eden-Query has the same features as [tRPC's react-query integration](https://trpc.io/docs/client/react),
while supporting great defaults for getting started quickly.

## Core Features

<Deck>
    <Card title="Batching" href="./batching">
        Batching by the client and server
    </Card>
    <Card title="Transformers" href="./transformers">
        Transformers to extend JSON data
    </Card>
    <Card title="Links" href="./links">
        Links to control the request flow
    </Card>
</Deck>

## Implementations

Eden-Query offers two implementations, [fetch](#fetch) and [treaty](#treaty),
just like the official eden library.

::: code-group

```typescript [treaty]
eden.greeting({ name: 'Elysia' }).get.createQuery()
```

```typescript [fetch]
eden.createQuery('/greeting/:name', { method: 'GET', params: { name: 'Elysia' } })
```

:::

### Fetch (WIP)

- Tanstack-query hooks are exposed at the root of the proxy.
- The full path to the route is provided as the first argument.
- Input to the route, such as query and route parameters, are provided after the path.

:::warning
This has not been implemented for any framework yet...
:::

### Treaty

- API routes are split by their path segments, and represented as a nested object.
- `/api/a/b` -> `eden.api.a.b`.
- The method and hook are provided as the last two property accesses.
- `eden.api.a.b.get.createQuery` -> `createQuery` for `GET` request to `/api/a/b`.

#### Example Application

::: code-group

```typescript twoslash include eq-index-application [server.ts]
import { Elysia, t } from 'elysia'

const app = new Elysia()
  .get('/nendoroid/:id/name', () => {
    return 'Skadi'
  })
  .put(
    '/nendoroid/:id',
    (context) => {
      return { status: 'OK', received: context.body }
    },
    {
      body: t.Object({
        name: t.String(),
        from: t.String(),
      }),
    },
  )
  .listen(3000)

export type App = typeof app
```

:::

#### Example React-Query Usage

A React client application cna use the hooks from Eden-Query to manage asynchronous state from the Elysia server application.

::: code-group

```typescript twoslash [index.ts]
// @filename: server.ts
// @include: eq-index-application

// @filename: index.ts
// ---cut---
import { createEdenTreatyReactQuery } from '@ap0nia/eden-react-query'
import type { App } from './server'

/**
 * The domain is usually needed if the client application
 * is not part of a full stack framework.
 *
 * For example, a React single-page-application would need to specify
 * the server domain, while a Next.js application would not.
 *
 * Follow the steps provided in the specific framework integration.
 */
const domain = 'localhost:3000'

export const app = createEdenTreatyReactQuery<App>({ domain })

// useQuery for [GET] request to '/nendoroid/:id/name'
const { data } = await app.nendoroid({ id: 'skadi' }).name.get.useQuery()

// useMutation for [PUT] request to '/nendoroid/:id'
const { data: nendoroid, error, mutateAsync } = app.nendoroid({ id: 1895 }).put.useMutation()

// Peform the mutation...
mutateAsync({ name: 'Skadi', from: 'Arknights' }).then((result) => {
  result
  // ^?
})
```

:::

::: tip
`useMutation` does not actually perform the request.
The result of `useMutation` has `mutate` and `mutateAsync` methods that receive the input to make the request.

[Read more about mutations here](https://tanstack.com/query/latest/docs/framework/react/reference/useMutation#usemutation).
:::

## Comparison with tRPC

### Links

This library supports the same type of [links that tRPC has](https://trpc.io/docs/client/links).

The official eden library only resolves requests, so Eden-Query provides helper methods to
quickly initialize a client that does the same.

Read more about Eden-Query links [here](./links).

#### eden.createHttpClient

This creates a basic eden client that resolves requests in the same way as the official eden implementation.

```typescript twoslash
import { createEdenTreatyReactQuery, httpLink } from '@ap0nia/eden-react-query'

const eden = createEdenTreatyReactQuery()

const domain = 'http://localhost:3000'

// Both are the exact same clients.

const clientOne = eden.createClient({
  links: [httpLink({ domain })],
})

const clientTwo = eden.createHttpClient({ domain })
```

::: tip
Using this helper method means you don't have to initialize an `httpLink` from scratch,
and you can provide `HTTPLinkOptions` directly to the method to create the client.
:::

#### eden.createHttpBatchClient

Creates a client that can combine multiple requests into a single batch request.

:::warning
In order for this client to work properly, the Elysia server application must use the `batchPlugin`
or `edenPlugin` with the `batch` property defined.
:::

**Elysia.js application with batching enabled**

::: code-group

```typescript twoslash include eq-index-batch-application [server.ts]
import { Elysia, t } from 'elysia'
import { edenPlugin } from '@ap0nia/eden-react-query/server'

const app = new Elysia().use(edenPlugin({ batch: true }))

export type App = typeof app
```

:::

**React-Query Batch Client**

::: code-group

```typescript twoslash [index.ts]
// @filename: server.ts
// @include: eq-index-batch-application

// @filename: index.ts
// ---cut---
import { createEdenTreatyReactQuery, httpBatchLink } from '@ap0nia/eden-react-query'
import type { App } from './server'

const eden = createEdenTreatyReactQuery<App>()

const domain = 'http://localhost:3000'

// Both are the exact same clients.

const clientOne = eden.createClient({
  links: [httpBatchLink({ domain, endpoint: '/api/batch' })],
})

const clientTwo = eden.createHttpBatchClient({ domain })
```

:::

### Transformers

This library supports the [same transformer API as tRPC](https://trpc.io/docs/server/data-transformers).

:::info
The transformers will only modify `request.body`.
So this will **NOT** affect GET, OPTIONS, or HEAD requests; only POST, PUT, PATCH, etc.
:::

Read more about this Eden-Query transformers [here](./transformers).

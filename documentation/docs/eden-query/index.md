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
    <Card title="Batching" href="/eden-query/batching">
        Batching by the client and server
    </Card>
    <Card title="Transformers" href="/eden-query/transformers">
        Transformers to extend JSON data
    </Card>
    <Card title="Links" href="/eden-query/links">
        Links to control the request flow
    </Card>
</Deck>

## Implementations

Eden-Query offers two implementations, [fetch](#fetch) and [treaty](#treaty),
just like the official eden library.

::: code-group

```typescript [treaty]
eden.greeting[':name'].get.createQuery({ params: { name: 'Elysia' } })
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

export const app = createEdenTreatyReactQuery<App>({
  domain: 'localhost:3000',
})

// useQuery for [GET] request to '/nendoroid/:id/name'
const { data } = await app.nendoroid[':id'].name.get.useQuery({
  params: { id: 'skadi' },
})

// useMutation for [PUT] request to '/nendoroid/:id'
const { data: nendoroid, error, mutateAsync } = app.nendoroid[':id'].put.useMutation()

// Peform the mutation...
mutateAsync({ name: 'Skadi', from: 'Arknights' }, { params: { id: '1895' } }).then((result) => {
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

## Comparison with Eden-Treaty

### Params

Passing in dynamic path params is different between this implementation of Treaty and the official one.

The official implementation treats the path param as a function call
[dynamic path params](https://elysiajs.com/eden/treaty/overview.html#dynamic-path).

This implementation accepts a `params` property in one of the arguments of the final function call.

❌ Official implementation

```typescript
utils.nendoroid({ id: '1895' }).name.get.fetch()
```

✅ This implementation

```typescript
utils.nendoroid[':id'].name.get.fetch({ params: { id: '1895' } })
```

#### Reasoning

- Svelte (4) has unique constraints for handling reactivity in svelte-query properly.
- I'm not fully confident in the heuristics used to distinguish between function calls for path parameters vs. hooks.

It may be possible, and you can read my implementation notes [here](/eden-query/overview#implementing-treaty-params).

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
import { edenPlugin } from '@ap0nia/eden-react-query'

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

## Notes

### Implementing Treaty Params

In Svelte (4), all reactivity needs to be encapsulated via readable, writable, etc. interfaces
in order for features like [placeholder data](https://tanstack.com/query/latest/docs/framework/react/guides/paginated-queries#better-paginated-queries-with-placeholderdata)
to function properly.

However, this means that a heuristic has to be applied to every function call in order
to determine if it's a valid `eden-treaty-svelte-query` hook, and the accummulation of
both readable and static params must be parsed and reduced into a single object...difficult!

```typescript twoslash
// @filename: server.ts
import { Elysia, t } from 'elysia'

const app = new Elysia()
  .get(
    '/nendoroid/:id/:name',
    () => {
      return 'Skadi'
    },
    {
      query: t.Object({
        filter: t.String(),
      }),
    },
  )
  .listen(3000)

export type App = typeof app

// @filename: index.ts
// ---cut---
import { derived, readable, writable, type Readable } from 'svelte/store'
import { createEdenTreatySvelteQuery } from '@ap0nia/eden-svelte-query'
import { createQuery, type StoreOrVal } from '@tanstack/svelte-query'
import type { App } from './server'

export const eden = createEdenTreatySvelteQuery<App>({ domain: 'localhost:3000' })

/**
 * Dynamic and reactive path param.
 */
const id = writable({ id: '1895' })

/**
 * Static path param.
 */
const name = { name: '' }

/**
 * Reactive query input.
 */
const query = writable({ query: { filter: '' } })

// The implementation needs to support both reactive and static inputs at all points in the chain...

const example = (eden as any).nendoroid(id)(name).get.createQuery(query)

function isStore<T>(value: StoreOrVal<T>): value is Readable<T> {
  return value != null && typeof value === 'object' && 'subscribe' in value
}

/**
 * Proxy implementation (Svelte 4).
 *
 * Would be similar but simpler for React since the original reference to inputs doesn't need to be
 * preserved; the entire component probably re-renders anyways.
 */
function createQueryProxy(paths: string[] = [], params: any[] = []) {
  return new Proxy(() => {}, {
    get: (_target, path: string, _receiver): any => {
      const nextPaths = path === 'index' ? [...paths] : [...paths, path]
      return createQueryProxy(nextPaths, params)
    },
    apply: (_target, _thisArg, args) => {
      const pathsCopy = [...paths]

      const hook = pathsCopy.pop() ?? ''

      const [options] = args

      // Do something if it's a valid hook...
      if (hook === 'createQuery') {
        // Filter through all params that were parsed...

        const readableParams: Readable<any>[] = []

        /**
         * Non-readable params can be used to calculate the intial params.
         */
        const staticParams: any = {}

        for (const p of params) {
          if (isStore(p)) {
            readableParams.push(p)
            continue
          }

          const first = Object.entries(p)[0]

          // Null check, but params should always be one key -> one value
          if (first?.[0] == null || first?.[1] == null) continue

          staticParams[first[0]] = first[1]
        }

        const paramsStore = derived(readableParams, ($paramsArray) => {
          /**
           * Using a shallow copy of the staticly calculated params as a based,
           * set all params that were readable and may have updated.
           */
          const result = $paramsArray.reduce(
            (previous, current) => {
              const firstPair = Object.entries(current)[0]

              if (firstPair == null) return previous

              const [paramKey, paramValue] = firstPair

              if (paramKey && paramValue) {
                previous[paramKey] = paramValue
              }

              return previous
            },
            { ...staticParams },
          )

          return result
        })

        /**
         * GET options like `query` and `headers`. Does NOT include `params`.
         * Just convert to a store so it's easy to include in the `derived` function call.
         */
        const optionsStore = isStore(options) ? options : readable(options)

        /**
         * Final input store should have `query` and `params` in one readable,
         * along with any other options specified, like `headers`.
         */
        const inputStore = derived([paramsStore, optionsStore], ([$params, $options]) => {
          return {
            params: $params,
            ...$options,
          }
        })

        /**
         * Using the input store, derive the query options...
         */
        const queryOptions = derived(inputStore, ($input) => {
          return {
            queryKey: [],
          }
        })

        return createQuery(queryOptions)
      }

      /**
       * If the first argument is a param, pass it into the params array for processing later in the proxy.
       *
       * @todo Better heuristic for determining if it's a path param...
       */
      if (options != null || isStore(options)) {
        return createQueryProxy(paths, [...params, options])
      }

      // Other edge cases...
      return
    },
  })
}
```

---
title: tanstack-query - ElysiaJS
head:
  - - meta
    - property: 'og:title'
      content: End-to-End Type Safety with tanstack-query integrations - ElysiaJS

  - - meta
    - name: 'description'
      content: Integration between Eden and tanstack-query.

  - - meta
    - property: 'og:description'
      content: Integration between Eden and tanstack-query.
---

<script setup>
    import Card from '../../components/nearl/card.vue'
    import Deck from '../../components/nearl/card-deck.vue'
</script>

# Introduction

The goal of eden + tanstack-query is to provide a similar interface to
[tRPC's react-query integration](https://trpc.io/docs/client/react),
while supporting all the functionality provided by the
[official Eden implementation](https://elysiajs.com/eden/overview.html).

## Features

> Interesting, universal features this library supports!

<Deck>
    <Card title="Batching" href="/eden-query/batching">
        Batching
    </Card>
    <Card title="Links" href="/eden-query/links">
        Links
    </Card>
    <Card title="Transformers" href="/eden-query/transformers">
        Transformers
    </Card>
</Deck>

## Implementations

eden + tanstack-query aims to offer two implementations/APIs, **treaty** and **fetch**,
just like the official eden library.

### Fetch (WIP)

None of the integrations have implemented this yet...

### Treaty

Based on the [official example of eden treaty](/eden/treaty/overview),
this is how the react-query hooks have been integrated with eden.

```typescript twoslash
// @filename: server.ts
import { Elysia, t } from 'elysia'

const app = new Elysia()
  .get('/', 'hi')
  .put('/nendoroid/:id', ({ body }) => body, {
    body: t.Object({
      name: t.String(),
      from: t.String(),
    }),
  })
  .listen(3000)

export type App = typeof app

// @filename: index.ts
// ---cut---
import { createEdenTreatyReactQuery } from '@ap0nia/eden-react-query'
import type { App } from './server'

export const app = createEdenTreatyReactQuery<App>({ domain: 'localhost:3000' })

// useQuery + [GET] at '/'
const { data } = await app.index.get.useQuery()

// useMutation + [PUT] at '/nendoroid/:id'
const { data: nendoroid, error, mutate } = app.nendoroid[':id'].put.useMutation()

// Peform the mutation...
mutate({ name: 'Skadi', from: 'Arknights' }, { params: { id: '1895' } })
```

## Comparison with Eden-Treaty

### Params

This implementation of Treaty differs from the offical Treaty when passing in dynamic path params.

The official Eden Treaty implementation uses function calls to pass in
[dynamic path params](https://elysiajs.com/eden/treaty/overview.html#dynamic-path).

This implementation of Treaty will have dynamic path params passed via a `params` property in an argument.
The position of this argument may vary depending on the type of tanstack-query hook invoked,
so pay attention to the types.

For example.

```ts twoslash
// @filename: server.ts
import { Elysia, t } from 'elysia'

const app = new Elysia().get('/nendoroid/:id/name', () => 'Skadi').listen(3000)

export type App = typeof app

// @filename: index.ts
// ---cut---
import { createEdenTreatyReactQuery } from '@ap0nia/eden-react-query'
import type { App } from './server'

export const eden = createEdenTreatyReactQuery<App>({ domain: 'localhost:3000' })

const utils = eden.useUtils()

// This implementation of treaty passes in params in the argument:
utils.nendoroid[':id'].name.get.fetch({ params: { id: '1895' } })

// Possible future implementation that's more similar to official treaty:
// utils.nendoroid({ id: '1895' }).name.get.fetch()
```

While the official implementation have better developer experience, it's challenging to incorporate
this into the svelte-query integration because stores have to be used for reactivity.

In other words, a reactive, dynamic path in svelte-query would require the developer to pass
in a store for each dynamic path param, and then the actual implementation would need to
coalesce all path params into a single store.

It seems pretty involved...read the implementation notes [here](/eden-query/overview#implementing-treaty-params)

## Comparison with tRPC

### Links

This library supports the same type of [links that tRPC has](https://trpc.io/docs/client/links).
Because opting into this links API adds complexity to the initialization of the eden client,
helper methods are exposed to make it simpler.

#### eden.createHttpClient

Creates the most basic eden client, which resolves requests in the same way as the official eden implementation.
This is a good default option to use.

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

#### eden.createHttpBatchClient

Creates a client similar to the basic one, but coalesces multiple requests sent in the same
event loop into a single batch request.

:::info
In order to use this client successfully, the elysia server application must use the `batchPlugin`
or `edenPlugin` with the `batch` property defined.
:::

```typescript twoslash
// @filename: server.ts
import { Elysia, t } from 'elysia'
import { batchPlugin, edenPlugin } from '@ap0nia/eden-react-query'

/**
 * Batch options are optional...

 * @remarks Note the custom endpoint!.
 */
const batchOptions = { endpoint: '/api/batch' }

const app = new Elysia()
  /**
   * Option 1: use `batchPlugin` directly.
   */
  .use(batchPlugin(batchOptions))

  /**
   * Option 2: use `edenPlugin` and pass `batchOptions` as the `batch` property.
   */
  .use(edenPlugin({ batch: batchOptions }))

  /**
   * Option 3: to enable batching but without any options, pass `true`.
   */
  .use(edenPlugin({ batch: true }))

export type App = typeof app

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

:::warning
If the batch endpoint is custom on the backend, ensure that it's the same on the client.

TODO: maybe enforce this at the type-level?
:::

### Transformers

This library supports the [same transformer API as tRPC](https://trpc.io/docs/server/data-transformers).

:::info
The transformers only modify `request.body`.
i.e. NOT GET, OPTIONS, or HEAD requests; only POST, PUT, PATCH, etc.
:::

## Notes

### Implementing Treaty Params

In Svelte (4), all reactivity needs to be encapsulated via readable, writable, etc. interfaces
in order for features like [placeholder data](https://tanstack.com/query/latest/docs/framework/react/guides/paginated-queries#better-paginated-queries-with-placeholderdata)
to function properly.

However, this means that a heuristic has to be applied to every function call in order
to determine if it's a valid `eden-treaty-svelte-query` hook, and the accummulation of
both readable and static params must be parsed and reduced into a single object...difficult!

```ts twoslash
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

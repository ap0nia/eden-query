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
  .get('/users', () => 'Skadi')
  .put('/nendoroid/:id', ({ body }) => body, {
    body: t.Object({
      name: t.String(),
      from: t.String(),
    }),
  })
  .get('/nendoroid/:id/name', () => 'Skadi')
  .listen(3000)

export type App = typeof app

// @filename: index.ts
// ---cut---
import { treaty } from '@elysiajs/eden'
import { createEdenTreatyQuery } from '@elysiajs/eden-react-query'
import type { App } from './server'

export const app = createEdenTreatyQuery<App>({ domain: 'localhost:3000' })

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
import { treaty } from '@elysiajs/eden'
import { createEdenTreatyQuery } from '@elysiajs/eden-react-query'
import type { App } from './server'

export const eden = createEdenTreatyQuery<App>({ domain: 'localhost:3000' })

const utils = eden.useUtils()

// this implementation of treaty:
utils.nendoroid[':id'].name.get.fetch({ params: { id: '1895' } })

// possible implementation similar to official treaty:
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

Creates the most basic eden client, resolves requests in the same way as the official eden implementation.
This is a good default option to use.

```typescript twoslash
import { createEdenTreatyQuery, httpLink } from '@elysiajs/eden-react-query'

const eden = createEdenTreatyQuery()

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
In order to use this client successfully, the elysia server application must use the `batchPlugin`.
:::

```typescript twoslash
// @filename: server.ts
import { Elysia, t } from 'elysia'
import { batchPlugin } from '@elysiajs/eden-react-query'

const app = new Elysia()
  .use(batchPlugin())
  .get('/a', () => 'A')
  .get('/b', () => 'B')

export type App = typeof app

// @filename: index.ts
// ---cut---
import { createEdenTreatyQuery, httpBatchLink } from '@elysiajs/eden-react-query'
import type { App } from './server'

const eden = createEdenTreatyQuery<App>()

const domain = 'http://localhost:3000'

// Both are the exact same clients.

const clientOne = eden.createClient({
  links: [httpBatchLink({ domain })],
})

const clientTwo = eden.createHttpBatchClient({ domain })
```

### Transformers

This library supports the [same transformer API as tRPC](https://trpc.io/docs/server/data-transformers).

:::info
The transformers only modify `request.body`.
i.e. NOT GET, OPTIONS, or HEAD requests; only POST, PUT, PATCH, etc.
:::

## Notes

### Implementing Treaty Params

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
import { treaty } from '@elysiajs/eden'
import { createEdenTreatyQuery } from '@elysiajs/eden-svelte-query'
import type { App } from './server'
import { createQuery, type StoreOrVal } from '@tanstack/svelte-query'

export const eden = createEdenTreatyQuery<App>({ domain: 'localhost:3000' })

const id = writable({ id: '1895' })

const query = writable({ query: { filter: '' } })

// If params were passed in via function calls in the middle of the proxy chain.
// It would need to support readable objects and regular objects.

const example = (eden as any).nendoroid(id)({ name: '' }).get.createQuery(query)

function isStore<T>(value: StoreOrVal<T>): value is Readable<T> {
  return value != null && typeof value === 'object' && 'subscribe' in value
}

// implementation
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
        /**
         * Params are manually added to the `params` array if they were in a function call.
         */
        const readableParams: Readable<any>[] = params.map((previous, current) => {
          const currentStore = isStore(current) ? current : readable(current)
          previous.push(currentStore)
          return previous
        }, [])

        const paramsStore = derived(readableParams, ($paramsArray) => {
          return $paramsArray.reduce((previous, current) => {
            const firstPair = Object.entries(current)[0]

            if (firstPair == null) return previous

            const [paramKey, paramValue] = firstPair

            if (paramKey && paramValue) {
              previous[paramKey] = paramValue
            }

            return previous
          }, {} as any)
        })

        /**
         * GET options like `query` and `headers`. Does NOT include `params`.
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
       * If the first argument is a store, pass it into the params array for processing later.
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

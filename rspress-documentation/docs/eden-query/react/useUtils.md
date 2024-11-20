---
title: useUtils Eden-React-Query - ElysiaJS
head:
  - - meta
    - property: 'og:title'
      content: useUtils Eden-React-Query - ElysiaJS

  - - meta
    - name: 'description'
      content: useUtils Eden-React-Query - ElysiaJS

  - - meta
    - property: 'og:description'
      content: useUtils Eden-React-Query - ElysiaJS
---

# useUtils

`useUtils` is a hook that gives you access to helpers that let you manage the cached data of the queries you execute via `@ap0nia/eden-react-query`.
These helpers are actually thin wrappers around `@tanstack/react-query`'s [`queryClient`](https://tanstack.com/query/v5/docs/reference/QueryClient) methods.

If you want more in-depth information about options and usage patterns for `useContext` helpers than what we provide here,
we will link to their respective `@tanstack/react-query` docs so you can refer to them accordingly.

:::info

This hook is an alias for `useContext()`.

:::

## Usage

### Elysia Server Application

::: code-group

```typescript twoslash include eq-react-useUtils-application [server.ts]
import { Elysia, t } from 'elysia'
import { batchPlugin } from '@ap0nia/eden-react-query/server'

export const app = new Elysia()
  .use(batchPlugin())
  .get('/post/all', (context) => {
    return {
      posts: [
        { id: 1, title: 'everlong' },
        { id: 2, title: 'After Dark' },
      ],
    }
  })
  .post(
    '/post/edit',
    (context) => {
      return { post: { id: context.body.id, title: context.body.title } }
    },
    {
      body: t.Object({
        id: t.Number(),
        title: t.String(),
      }),
    },
  )
  .get('/post/:id', (context) => {
    return {
      post: { id: context.params.id, title: 'Look me up!' },
    }
  })
  .get('/user/all', () => {
    return { users: [{ name: 'Dave Grohl' }, { name: 'Haruki Murakami' }] }
  })

export type App = typeof app
```

:::

### Eden-Query Client

::: code-group

```typescript twoslash [eden.ts]
// @filename: server.ts
// ---cut---
// @include: eq-react-useUtils-application

// @filename: eden.ts
// ---cut---
import { createEdenTreatyReactQuery } from '@ap0nia/eden-react-query'
import type { App } from './server'

export const eden = createEdenTreatyReactQuery<App>()
```

:::

`useUtils` returns an object with all the available queries you have in your routers.
You use it the same way as your `eden` "utils" object.
Once you reach a query, you'll have access to the query helpers.

In our component, when we navigate the object `useUtils` gives us and reach the `post.all` query,
we'll get access to our query helpers!

::: code-group

```typescript twoslash [index.tsx]
// @filename: server.ts
// ---cut---
// @include: eq-react-useUtils-application

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

export function MyComponent() {
  const utils = eden.useUtils()
  utils.post.all.get.f
  //                  ^|
  // [...]
}
```

:::

## Helpers

These are the helpers you'll get access to via `useUtils`.
The table below will help you know which Eden helper wraps which `@tanstack/react-query` helper method.
Each react-query method will link to its respective docs/guide:

| eden helper wrapper   | `@tanstack/react-query` helper method                                                                                            |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `fetch`               | [`queryClient.fetchQuery`](https://tanstack.com/query/v5/docs/reference/QueryClient#queryclientfetchquery)                       |
| `prefetch`            | [`queryClient.prefetchQuery`](https://tanstack.com/query/v5/docs/framework/react/guides/prefetching)                             |
| `fetchInfinite`       | [`queryClient.fetchInfiniteQuery`](https://tanstack.com/query/v5/docs/reference/QueryClient#queryclientfetchinfinitequery)       |
| `prefetchInfinite`    | [`queryClient.prefetchInfiniteQuery`](https://tanstack.com/query/v5/docs/reference/QueryClient#queryclientprefetchinfinitequery) |
| `ensureData`          | [`queryClient.ensureData`](https://tanstack.com/query/v5/docs/reference/QueryClient#queryclientensurequerydata)                  |
| `invalidate`          | [`queryClient.invalidateQueries`](https://tanstack.com/query/v5/docs/framework/react/guides/query-invalidation)                  |
| `refetch`             | [`queryClient.refetchQueries`](https://tanstack.com/query/v5/docs/reference/QueryClient#queryclientrefetchqueries)               |
| `cancel`              | [`queryClient.cancelQueries`](https://tanstack.com/query/v5/docs/framework/react/guides/query-cancellation)                      |
| `setData`             | [`queryClient.setQueryData`](https://tanstack.com/query/v5/docs/reference/QueryClient#queryclientsetquerydata)                   |
| `setQueriesData`      | [`queryClient.setQueriesData`](https://tanstack.com/query/v5/docs/reference/QueryClient#queryclientsetqueriesdata)               |
| `getData`             | [`queryClient.getQueryData`](https://tanstack.com/query/v5/docs/reference/QueryClient#queryclientgetquerydata)                   |
| `setInfiniteData`     | [`queryClient.setInfiniteQueryData`](https://tanstack.com/query/v5/docs/reference/QueryClient#queryclientsetquerydata)           |
| `getInfiniteData`     | [`queryClient.getInfiniteData`](https://tanstack.com/query/v5/docs/reference/QueryClient#queryclientgetquerydata)                |
| `setMutationDefaults` | [`queryClient.setMutationDefaults`](https://tanstack.com/query/v5/docs/reference/QueryClient#queryclientsetmutationdefaults)     |
| `getMutationDefaults` | [`queryClient.getMutationDefaults`](https://tanstack.com/query/v5/docs/reference/QueryClient#queryclientgetmutationdefaults)     |
| `isMutating`          | [`queryClient.isMutating`](https://tanstack.com/query/v5/docs/reference/QueryClient#queryclientismutating)                       |

### ❓ The function I want isn't here!

`@tanstack/react-query` has a lot of functions that we haven't put in the Eden context yet.
If you need a function that isn't here, feel free to [open a feature request](https://github.com/trpc/trpc/issues/new/choose) requesting it.

In the meantime, you can import and use the function directly from `@tanstack/react-query`.
We also provide a [getQueryKey](./getQueryKey)
which you can use to get the correct queryKey on the filters when using these functions.

## Proxy client

:::warning
WIP, this should be the same as the official Eden-Treaty API.
:::

In addition to the above react-query helpers, the context also exposes your Eden proxy client.
This lets you call your procedures with `async`/`await` without needing to create an additional vanilla client.

```tsx
import { trpc } from '../utils/trpc'

function MyComponent() {
  const [apiKey, setApiKey] = useState()
  const utils = trpc.useUtils()

  return (
    <Form
      handleSubmit={async (event) => {
        const apiKey = await utils.client.apiKey.create.mutate(event)
        setApiKey(apiKey)
      }}
    >
      ...
    </Form>
  )
}
```

## Query Invalidation

You invalidate queries via the `invalidate` helper.
`invalidate` is actually a special helper given that, unlike the other helpers, it's available at every level of the router map. This means you can either run `invalidate` on a single query, a whole router, or every router if you want. We get more in detail in the sections below.

### Invalidating a single query

You can invalidate a query relating to a single procedure and even filter based
on the input passed to it to prevent unnecessary calls to the back end.

#### Example code

::: code-group

```typescript twoslash [index.tsx]
// @filename: server.ts
// ---cut---
// @include: eq-react-useUtils-application

// @filename: eden.ts
// ---cut---
import { createEdenTreatyReactQuery } from '@ap0nia/eden-react-query'
import type { App } from './server'

export const eden = createEdenTreatyReactQuery<App>()

// @filename: index.tsx
// ---cut---
import React from 'react'
import { eden } from './eden'

function MyComponent() {
  const utils = eden.useUtils()

  const mutation = eden.post.edit.post.useMutation({
    onSuccess(input) {
      utils.post.all.invalidate()
      utils.post[':id'].get.invalidate({ params: { id: input.post.id + '' } }) // Will not invalidate queries for other id's 👍
    },
  })

  // [...]
}
```

:::

### Invalidating across whole routers

It is also possible to invalidate queries across an entire router rather then
just one query.

::: code-group

```typescript twoslash [index.tsx]
// @filename: server.ts
// ---cut---
// @include: eq-react-useUtils-application

// @filename: eden.ts
// ---cut---
import { createEdenTreatyReactQuery } from '@ap0nia/eden-react-query'
import type { App } from './server'

export const eden = createEdenTreatyReactQuery<App>()

// @filename: index.tsx
// ---cut---
import React from 'react'
import { eden } from './eden'

export function MyComponent() {
  const utils = eden.useUtils()

  const invalidateAllQueriesAcrossAllRouters = () => {
    // 1️⃣
    // All queries on all routers will be invalidated 🔥
    utils.invalidate()
  }

  const invalidateAllPostQueries = () => {
    // 2️⃣
    // All post queries will be invalidated 📭
    utils.post.invalidate()
  }

  const invalidatePostById = () => {
    // 3️⃣
    // All queries in the post router with path params { id: 1 } invalidated 📭
    utils.post({ id: 1 }).get.invalidate()
  }

  // Example queries
  eden.user.all.get.useQuery() // Would only be validated by 1️⃣ only.
  eden.post.all.get.useQuery() // Would be invalidated by 1️⃣ & 2️⃣
  eden.post({ id: 1 }).get.useQuery() // Would be invalidated by 1️⃣, 2️⃣ and 3️⃣
  eden.post({ id: 2 }).get.useQuery() // would be invalidated by 1️⃣ and 2️⃣ but NOT 3️⃣!
}
```

:::

### Invalidate full cache on every mutation

Keeping track of exactly what queries a mutation should invalidate is hard, therefore, it can be a pragmatic solution to invalidate the _full cache_ as a side-effect on any mutation. Since we have request batching, this invalidation will simply refetch all queries on the page you're looking at in one single request.

We have added a feature to help with this:

::: code-group

```typescript twoslash [src/lib/eden.ts]
// @filename: server.ts
// ---cut---
// @include: eq-react-useUtils-application

// @filename: index.tsx
// ---cut---
import { createEdenTreatyReactQuery } from '@ap0nia/eden-react-query'
import type { App } from './server'

export const eden = createEdenTreatyReactQuery<App>({
  overrides: {
    useMutation: {
      /**
       * This function is called whenever a `.useMutation` succeeds
       **/
      async onSuccess(opts) {
        /**
         * @note that order here matters:
         * The order here allows route changes in `onSuccess` without
         * having a flash of content change whilst redirecting.
         **/

        // Calls the `onSuccess` defined in the `useQuery()`-options:
        await opts.originalFn()

        // Invalidate all queries in the react-query cache:
        await opts.queryClient.invalidateQueries()
      },
    },
  },
})
```

:::

## Additional Options

Aside from the query helpers, the object `useUtils` returns also contains the following properties:

```ts
interface EdenContextProps<TElysia extends AnyElysia, TSSRContext> {
  /**
   * The `EdenClient`
   */
  client: EdenClient<TElysia>

  /**
   * The SSR context when server-side rendering
   * @default null
   */
  ssrContext?: TSSRContext | null

  /**
   * State of SSR hydration.
   * - `false` if not using SSR.
   * - `prepass` when doing a prepass to fetch queries' data
   * - `mounting` before TRPCProvider has been rendered on the client
   * - `mounted` when the TRPCProvider has been rendered on the client
   * @default false
   */
  ssrState?: SSRState

  /**
   * Abort loading query calls when unmounting a component - usually when navigating to a new page
   * @default false
   */
  abortOnUnmount?: boolean
}
```

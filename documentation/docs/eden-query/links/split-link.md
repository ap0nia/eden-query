---
id: splitLink
title: Split Link
sidebar_label: Split Link
slug: /client/links/splitLink
---

# Split Link

`splitLink` is a link that allows you to branch your link chain's execution depending on a given condition. Both the `true` and `false` branches are required. You can provide just one link, or multiple links per branch via an array.

It's important to note that when you provide links for `splitLink` to execute, `splitLink` will create an entirely new link chain based on the links you passed. Therefore, you need to use a [**terminating link**](./overview.md#the-terminating-link) if you only provide one link or add the terminating link at the end of the array if you provide multiple links to be executed on a branch. Here's a visual representation of how `splitLink` works:

<div align="center" style="marginBottom: 12px">
  <img src="/assets/split-link-diagram.svg" alt="Eden Split Link Diagram"/>
  <small>
    <span>Eden Split Link Diagram. Based on </span>
    <a href="https://trpc.io/docs/client/links/splitLink" target="_blank">tRPC's </a>,
  </small>
</div>

## Usage Example

### Disable batching for certain requests

Let's say you're using `httpBatchLink` as the terminating link in your tRPC client config. This means request batching is enabled in every request. However, if you need to disable batching only for certain requests, you would need to change the terminating link in your tRPC client config dynamically between `httpLink` and `httpBatchLink`. This is a perfect opportunity for `splitLink` to be used:

#### 1. Configure client / `utils/trpc.ts`

```typescript twoslash
// @filename: server.ts
import { Elysia, t } from 'elysia'

export const app = new Elysia().get('/', () => 'Hello, World!')

export type App = typeof app

// @filename: index.ts
// ---cut---
import { EdenClient, httpBatchLink, httpLink, splitLink } from '@elysiajs/eden-react-query'
import type { App } from './server'

const domain = 'http://localhost:3000'

const client = new EdenClient<App>({
  links: [
    splitLink({
      condition(op) {
        // check for context property `skipBatch`
        return Boolean(op.context.skipBatch)
      },
      // when condition is true, use normal request
      true: httpLink({
        domain,
      }),
      // when condition is false, use batching
      false: httpBatchLink({
        domain,
      }),
    }),
  ],
})
```

#### 2. Perform request without batching

:::warning
Not implemented yet...
:::

```typescript
const postResult = proxy.posts.query(null, {
  context: {
    skipBatch: true,
  },
})
```

or:

```typescript twoslash
// @filename: server.ts
import { Elysia, t } from 'elysia'

const posts = ['post 1', 'post 2', 'post 3']

export const app = new Elysia()
  .get('/', () => 'Hello, World!')
  .get('/posts', () => {
    return posts
  })

export type App = typeof app

// @filename: eden.ts
// ---cut---
import { createEdenTreatyQuery, httpBatchLink, httpLink, splitLink } from '@elysiajs/eden-react-query'
import type { App } from './server'

export const eden = createEdenTreatyQuery<App>()

// @filename: component.tsx
// ---cut---
import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { httpBatchLink, httpLink, splitLink } from '@elysiajs/eden-react-query'
import { eden } from './eden'

const domain = 'http://localhost:3000'

/**
 * Create a client and set in the provider's context.
 */
const client = eden.createClient({
  links: [
    splitLink({
      condition(op) {
        // check for context property `skipBatch`
        return Boolean(op.context.skipBatch)
      },

      // when condition is true, use normal request
      true: httpLink({ domain, }),

      // when condition is false, use batching
      false: httpBatchLink({ domain, }),
    }),
  ],
})

const queryClient = new QueryClient()

/**
 * Make sure that this component is used inside a context with the correct client.
 */
export function MyComponent() {
  const postsQuery = eden.posts.get.useQuery(undefined, {
    eden: {
      context: {
        skipBatch: true,
      },
    }
  });

  return (
    <pre>{JSON.stringify(postsQuery.data ?? null, null, 4)}</pre>
  )
}

/**
 * Example of page that sets the correct context values.
 */
export default function Page() {
  return (
    <eden.Provider client={client} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <MyComponent />
      </QueryClientProvider>
    </eden.Provider>
  )
}
```

## `splitLink` Options

The `splitLink` function takes an options object that has three fields: `condition`, `true`, and `false`.

```ts
function splitLink<TRouter extends AnyRouter = AnyRouter>(opts: {
  condition: (op: Operation) => boolean;
  /**
   * The link to execute next if the test function returns `true`.
   */
  true: TRPCLink<TRouter> | TRPCLink<TRouter>[];
  /**
   * The link to execute next if the test function returns `false`.
   */
  false: TRPCLink<TRouter> | TRPCLink<TRouter>[];
}) => TRPCLink<TRouter>
```

## Reference

You can check out the source code for this link on [GitHub.](https://github.com/trpc/trpc/blob/main/packages/client/src/links/splitLink.ts)

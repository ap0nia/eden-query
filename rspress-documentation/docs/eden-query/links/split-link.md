---
title: HTTP Split Link Eden-Query - ElysiaJS
head:
  - - meta
    - property: 'og:title'
      title: HTTP Split Link Eden-Query - ElysiaJS

  - - meta
    - name: 'description'
      content: HTTP Split Link for Eden and Tanstack-Query integration.

  - - meta
    - property: 'og:description'
      content: HTTP Split Link for Eden and Tanstack-Query integration.
---

# Split Link

`splitLink` is a link that allows you to branch your link chain's execution depending on a given condition.
Both the `true` and `false` branches are required.
You can provide just one link, or multiple links per branch via an array.

It's important to note that when you provide links for `splitLink` to execute,
`splitLink` will create an entirely new link chain based on the links you passed.
Therefore, you need to use a [**terminating link**](./index.md#the-terminating-link)
if you only provide one link or add the terminating link at the end of the array
if you provide multiple links to be executed on a branch.

Here's a visual representation of how `splitLink` works:

<div align="center" style="marginBottom: 12px">
  <img src="/assets/split-link-diagram.png" alt="Eden Split Link Diagram"/>
  <small>
    <span>Eden Split Link Diagram. Based on </span>
    <a href="https://trpc.io/docs/client/links/splitLink" target="_blank">tRPC's </a>,
  </small>
</div>

## Usage Example

### Disable batching for certain requests

Let's say you're using `httpBatchLink` as the terminating link in your tRPC client config. This means request batching is enabled in every request. However, if you need to disable batching only for certain requests, you would need to change the terminating link in your tRPC client config dynamically between `httpLink` and `httpBatchLink`. This is a perfect opportunity for `splitLink` to be used:

#### 1. Create Elysia Server Application

::: code-group

```typescript twoslash include eq-links-split-application [server.ts]
import { Elysia, t } from 'elysia'
import { batchPlugin } from '@ap0nia/eden-react-query/server'

const posts = ['post 1', 'post 2', 'post 3']

export const app = new Elysia()
  .use(batchPlugin())
  .get('/', () => 'Hello, World!')
  .get('/posts', () => {
    return posts
  })

export type App = typeof app
```

:::

#### 2. Configure eden client

::: code-group

```typescript twoslash include eden.ts [eden.ts]
// @filename: server.ts
// ---cut---
// @include: eq-links-split-application

// @filename: eden.ts
// ---cut---
import {
  createEdenTreatyReactQuery,
  httpBatchLink,
  httpLink,
  splitLink,
} from '@ap0nia/eden-react-query'
import type { App } from './server'

const domain = 'http://localhost:3000'

export const eden = createEdenTreatyReactQuery<App>()

export const client = eden.createClient({
  links: [
    splitLink({
      condition(operation) {
        // Check for context property `skipBatch`.
        return Boolean(operation.context.skipBatch)
      },

      // When condition is true, use normal request.
      true: httpLink({ domain }),

      // When condition is false, use batching.
      false: httpBatchLink({ domain }),
    }),
  ],
})
```

:::

#### 3. Perform request without batching

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

::: code-group

```typescript twoslash [index.tsx]
// @filename: server.ts
// @include: eq-links-split-application

// @filename: eden.ts
// ---cut---
import {
  createEdenTreatyReactQuery,
  httpBatchLink,
  httpLink,
  splitLink,
} from '@ap0nia/eden-react-query'
import type { App } from './server'

const domain = 'http://localhost:3000'

export const eden = createEdenTreatyReactQuery<App>()

export const client = eden.createClient({
  links: [
    splitLink({
      condition(operation) {
        // Check for context property `skipBatch`.
        return Boolean(operation.context.skipBatch)
      },

      // When condition is true, use normal request.
      true: httpLink({ domain }),

      // When condition is false, use batching.
      false: httpBatchLink({ domain }),
    }),
  ],
})

// @filename: index.tsx
// ---cut---
import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { httpBatchLink, httpLink, splitLink } from '@ap0nia/eden-react-query'
import { client, eden } from './eden'

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

:::

## `splitLink` Options

The `splitLink` function takes an options object that has three properties:
`condition`, `true`, and `false`.

```typescript
import type { AnyElysia } from 'elysia'
import type { EdenLink, Operation } from '@ap0nia/eden-react-query'

function splitLink<TElysia extends AnyElysia = AnyElysia>(options: {
  condition: (operation: Operation) => boolean;

  /**
   * The link to execute next if the test function returns `true`.
   */
  true: EdenLink<TElysia> | EdenLink<TElysia>[];

  /**
   * The link to execute next if the test function returns `false`.
   */
  false: EdenLink<TElysia> | EdenLink<TElysia>[];
}) => EdenLink<TElysia>
```

## Reference

You can check out the source code for this link on
[GitHub](https://github.com/ap0nia/eden-query/blob/main/packages/eden/src/links/split-link.ts).

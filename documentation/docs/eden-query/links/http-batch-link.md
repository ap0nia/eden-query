---
title: HTTP Batch Link Eden-Query - ElysiaJS
head:
  - - meta
    - property: 'og:title'
      title: HTTP Batch Link Eden-Query - ElysiaJS

  - - meta
    - name: 'description'
      content: HTTP Batch Link for Eden and Tanstack-Query integration.

  - - meta
    - property: 'og:description'
      content: HTTP Batch Link for Eden and Tanstack-Query integration.
---

# HTTP Batch Link

`httpBatchLink` is a [**terminating link**](./overview.md#the-terminating-link) that
batches an array of individual Eden requests into a single HTTP request that's sent
to a batch endpoint.

**_Ensure that your Elysia.js server application uses the batch plugin provided by this library._**

## Usage

### Elysia Server Application

::: code-group

```typescript twoslash include eq-links-batch-application [server.ts]
import { Elysia, t } from 'elysia'
import { batchPlugin } from '@ap0nia/eden-react-query/server'

export const app = new Elysia().use(batchPlugin()).get('/', () => 'Hello, World!')

export type App = typeof app
```

:::

You can import and add the `httpBatchLink` to the `links` array as such:

::: code-group

```typescript twoslash [index.ts]
// @filename: server.ts
// @include: eq-links-batch-application

// @filename: index.ts
// ---cut---
import { EdenClient, httpBatchLink } from '@ap0nia/eden-react-query'
import type { App } from './server'

const client = new EdenClient<App>({
  links: [
    httpBatchLink({
      domain: 'http://localhost:3000',
    }),
  ],
})
```

:::

After that, you can make use of batching by setting all your procedures in a `Promise.all`.
The code below will produce exactly **one** HTTP request and on the server exactly **one** database query:

```typescript
const somePosts = await Promise.all([
  client.post.byId.get(1),
  client.post.byId.get(2),
  client.post.byId.get(3),
])
```

:::warning
The usage displayed above is WIP, not implemented yet...
:::

## `httpBatchLink` Options

The `httpBatchLink` function takes an options object that has the `HTTPBatchLinkOptions` shape.

```typescript
export interface HTTPBatchLinkOptions extends HTTPLinkOptions {
  maxURLLength?: number
}

export interface HTTPLinkOptions {
  url: string

  /**
   * Custom polyfill for fetch.
   */
  fetch?: typeof fetch

  /**
   * Custom polyfill for AbortController.
   */
  AbortController?: typeof AbortController | null

  /**
   * Data transformer.
   * @see https://ap0nia.github.io/eden-query/eden-query/transformers
   **/
  transformer?: DataTransformerOptions

  /**
   * Headers to set on outgoing requests or a callback returns headers to set.
   * @see https://ap0nia.github.io/eden-query/eden-query/headers
   */
  headers?: HTTPHeaders | ((opts: { opList: Operation[] }) => HTTPHeaders | Promise<HTTPHeaders>)
}
```

## Setting a maximum URL length

When sending batch requests **_via GET requests_** and encoding the information in the request query,
sometimes the URL can become too large, causing HTTP errors like
[`413 Payload Too Large`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/413),
[`414 URI Too Long`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/414),
and [`404 Not Found`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/404).
The `maxURLLength` option will limit the number of requests that can be sent together in a batch.

> An alternative way of adding an HTTP Batch Link is demonstrated below

::: code-group

```typescript twoslash [index.ts]
// @filename: server.ts
// @include: eq-links-batch-application

// @filename: index.ts
// ---cut---
import { EdenClient, httpBatchLink } from '@ap0nia/eden-react-query'
import type { App } from './server'

const client = new EdenClient<App>({
  links: [
    httpBatchLink({
      domain: 'http://localhost:3000',
      maxURLLength: 2083,
      method: 'GET',
    }),
  ],
})
```

:::

## Disabling request batching

### 1. Do not use the batch plugin.

> The batch plugin is opt-in.

### 2. Replace `httpBatchLink` with [`httpLink`](./http-link.md) in your Eden Client

::: code-group

```typescript [index.ts]
import { EdenClient, httpLink } from '@ap0nia/eden-react-query'

const client = new EdenClient({
  links: [
    httpLink({
      domain: 'http://localhost:3000',
    }),
  ],
})
```

:::

or, if you're using Next.js:

:::warning
There is no explicit Next.js support yet. This is an example of what it may look like.
:::

```tsx
import type { App } from '@/server/routers/app'
import { createEdenNext, httpLink } from '@ap0nia/eden-next'

export const eden = createEdenNext<App>({
  config() {
    return {
      links: [
        httpLink({
          url: '/api/trpc',
        }),
      ],
    }
  },
})
```

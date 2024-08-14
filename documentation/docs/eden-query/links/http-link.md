---
title: HTTP Link Eden-Query - ElysiaJS
head:
  - - meta
    - property: 'og:title'
      content: HTTP Link Eden-Query - ElysiaJS

  - - meta
    - name: 'description'
      content: HTTP Link for Eden and Tanstack-Query integration.

  - - meta
    - property: 'og:description'
      content: HTTP Link for Eden and Tanstack-Query integration.
---

# HTTP Link

`httpLink` is a [**terminating link**](./index#the-terminating-link) that sends an
Eden operation to an Eden request handler over HTTP.

`httpLink` supports all HTTP methods.

## Usage

### Elysia Application

::: code-group

```typescript twoslash include eq-links-http-application
import { Elysia, t } from 'elysia'

export const app = new Elysia().get('/', () => 'Hello, World!')

export type App = typeof app
```

:::

You can import and add the `httpLink` to the `links` array as such:

::: code-group

```typescript twoslash [index.ts]
// @filename: server.ts
// @include: eq-links-http-application

// @filename: index.ts
// ---cut---
import { EdenClient, httpLink } from '@ap0nia/eden-react-query'
import type { App } from './server'

const client = new EdenClient<App>({
  links: [
    httpLink({
      domain: 'http://localhost:3000',
      // transformer,
    }),
  ],
})
```

:::

## `httpLink` Options

The `httpLink` function takes an options object that has the `HTTPLinkOptions` shape.

```typescript
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
   * Data transformer
   * @link https://trpc.io/docs/v11/data-transformers
   **/
  transformer?: DataTransformerOptions

  /**
   * Headers to be set on outgoing requests or a callback that of said headers

   * @link /eden-query/headers
   */
  headers?: HTTPHeaders | ((opts: { op: Operation }) => HTTPHeaders | Promise<HTTPHeaders>)

  /**
   * Send all requests as POSTS requests regardless of the procedure type
   * The server must separately allow overriding the method.

   * @see /eden-query/rpc
   */
  methodOverride?: 'POST'
}
```

## Reference

You can check out the source code for this link on
[GitHub.](https://github.com/ap0nia/eden-query/blob/main/packages/eden/src/links/http-link.ts)

---
id: httpLink
title: HTTP Link
sidebar_label: HTTP Link
slug: /client/links/httpLink
---

# HTTP Link

`httpLink` is a [**terminating link**](./index#the-terminating-link) that sends an
Eden operation to an Eden request handler over HTTP.

`httpLink` supports all HTTP methods.

## Usage

You can import and add the `httpLink` to the `links` array as such:

```typescript twoslash
// @filename: server.ts
import { Elysia, t } from 'elysia'

export const app = new Elysia().get('/', () => 'Hello, World!')

export type App = typeof app

// @filename: index.ts
// ---cut---
import { EdenClient, httpLink } from '@elysiajs/eden-react-query'
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

## `httpLink` Options

The `httpLink` function takes an options object that has the `HTTPLinkOptions` shape.

```ts
export interface HTTPLinkOptions {
  url: string

  /**
   * Add ponyfill for fetch
   */
  fetch?: typeof fetch

  /**
   * Add ponyfill for AbortController
   */
  AbortController?: typeof AbortController | null

  /**
   * Data transformer
   * @link https://trpc.io/docs/v11/data-transformers
   **/
  transformer?: DataTransformerOptions

  /**
   * Headers to be set on outgoing requests or a callback that of said headers
   * @link http://trpc.io/docs/v10/header
   */
  headers?: HTTPHeaders | ((opts: { op: Operation }) => HTTPHeaders | Promise<HTTPHeaders>)

  /**
   * Send all requests as POSTS requests regardless of the procedure type
   * The server must separately allow overriding the method.
   * @see https://trpc.io/docs/rpc
   */
  methodOverride?: 'POST'
}
```

## Reference

You can check out the source code for this link on
[GitHub.](https://github.com/ap0nia/eden-query/blob/main/packages/eden/src/links/http-link.ts)

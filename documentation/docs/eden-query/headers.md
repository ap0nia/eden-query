---
title: Headers Eden-Query - ElysiaJS
head:
  - - meta
    - property: 'og:title'
      content: Headers Eden-Query - ElysiaJS

  - - meta
    - name: 'description'
      content: Headers Eden-Query is a type-safe Elysia.js client with the powerful asynchronous state management of tanstack-query.

  - - meta
    - property: 'og:description'
      content: Headers Eden-Query is a type-safe Elysia.js client with the powerful asynchronous state management of tanstack-query.
---

The headers option can be customized in the config when using the
[`httpBatchLink`](./links/httpBatchLink.md) or the [`httpLink`](./links/httpLink.md).

`headers` can be both an object or a function.
If it's a function it will get called dynamically for every HTTP request.

<template>

```typescript twoslash include headers-example
import { Elysia } from 'elysia'
import { edenPlugin } from '@ap0nia/eden-react-query'

export const app = new Elysia().use(edenPlugin({ batch: true })).get('/', () => 'Hello, World!')

export type App = typeof app
```

</template>

::: code-group

```typescript twoslash title='utils/trpc.ts'
// @filename: ./src/server.ts
// @include: headers-example
// ---cut---

// Import the router type from your server file
import { createEdenTreatyReactQuery, httpBatchLink } from '@ap0nia/eden-react-query'
import type { App } from '../server'

let token: string

export function setToken(newToken: string) {
  /**
   * You can also save the token to cookies, and initialize from
   * cookies above.
   */
  token = newToken
}

export const eden = createEdenTreatyReactQuery<App>({
  config(opts) {
    return {
      links: [
        httpBatchLink({
          url: 'http://localhost:3000/api/trpc',
          /**
           * Headers will be called on each request.
           */
          headers() {
            return {
              Authorization: token,
            }
          },
        }),
      ],
    }
  },
})
```

:::

### Example with auth login

::: code-group

```typescript [src/pages/auth.tsx]
const loginMutation = eden.auth.login.post.useMutation({
  onSuccess(opts) {
    token = opts.accessToken
  },
})
```

:::

The `token` can be whatever you want it to be.
It's entirely up to you whether that's just a client-side variable that you update the value of
on success, or whether you store the token and pull it from local storage.

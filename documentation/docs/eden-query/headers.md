---
title: Headers Eden-Query - ElysiaJS
head:
  - - meta
    - property: 'og:title'
      content: Headers Eden-Query - ElysiaJS

  - - meta
    - name: 'description'
      content: >
        Set custom request headers with Eden-Query.

  - - meta
    - property: 'og:description'
      content: >
        Set custom request headers with Eden-Query.
---

The headers option can be customized in the config when using the
[`httpBatchLink`](./links/httpBatchLink.md) or the [`httpLink`](./links/httpLink.md).

`headers` can be both an object or a function.
If it's a function it will get called dynamically for every HTTP request.

## Example

### Elysia Server Application

::: code-group

```typescript twoslash include eq-headers-application [server.ts]
import { Elysia } from 'elysia'
import { edenPlugin } from '@ap0nia/eden-react-query/server'

export const app = new Elysia()
  .use(edenPlugin({ batch: true }))
  .get('/', () => 'Hello, World!')
  .post('/auth/login', () => {
    return { token: 'new access token' }
  })

export type App = typeof app
```

:::

### Client Usage (With Auth Example)

::: code-group

```typescript twoslash [index.ts]
// @filename: server.ts
// @include: eq-headers-application

// @filename: index.ts
// ---cut---
// Import the router type from your server file
import { createEdenTreatyReactQuery, httpBatchLink } from '@ap0nia/eden-react-query'
import type { App } from './server'

let token: string

export function setToken(newToken: string) {
  /**
   * You can also save the token to cookies, and initialize from
   * cookies above.
   */
  token = newToken
}

export const eden = createEdenTreatyReactQuery<App>()

const client = eden.createClient({
  links: [
    httpBatchLink({
      domain: 'http://localhost:3000/api/eden',

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
})

// With Auth Login
const loginMutation = eden.auth.login.post.useMutation({
  onSuccess(opts) {
    setToken(opts.token)
  },
})
```

:::

The `token` can be whatever you want it to be.
It's entirely up to you whether that's just a client-side variable that you update the value of
on success, or whether you store the token and pull it from local storage.

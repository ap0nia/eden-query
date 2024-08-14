---
title: CORS Eden-Query - ElysiaJS
head:
  - - meta
    - property: 'og:title'
      content: CORS Eden-Query - ElysiaJS

  - - meta
    - name: 'description'
      content: CORS Eden-Query - ElysiaJS

  - - meta
    - property: 'og:description'
      content: CORS Eden-Query - ElysiaJS
---

# CORS and Headers

If your API resides on a different origin than your front-end and you wish to send cookies to it,
you will need to enable [CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
on your server and send cookies with your requests by providing the option `{credentials: "include"}` to fetch.

The arguments provided to the fetch function used by Eden can be modified as follow.

::: code-group

```typescript [index.ts]
import { EdenClient, httpLink } from '@ap0nia/eden-react-query'

const client = new EdenClient({
  links: [
    httpLink({
      domain: 'YOUR_SERVER_URL',
      fetcher(url, options) {
        return fetch(url, {
          ...options,
          credentials: 'include',
        })
      },
    }),
  ],
})
```

:::

:::tip
Elysia provides a [CORS plugin](https://elysiajs.com/plugins/cors.html#cors-plugin) to easily enable CORs on your elysia application!
:::

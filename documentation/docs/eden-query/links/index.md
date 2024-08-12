---
title: Links Eden-Query - ElysiaJS
head:
  - - meta
    - property: 'og:title'
      content: Links for Eden and Tanstack-Query integration.

  - - meta
    - name: 'description'
      content: Links for Eden and Tanstack-Query integration.

  - - meta
    - property: 'og:description'
      content: Links for Eden and Tanstack-Query integration.
---

# Links

Refer to [tRPC's documentation on links](https://trpc.io/docs/client/links)
for more in-depth information.

Links enable you to customize the flow of data between the Eden Client and Server.
A link should do only one thing, which can be either a self-contained modification to
a Eden operation (query, mutation, or subscription) or a side-effect based on the operation (such as logging).

You can compose links together into an array that you can provide to the Eden client
configuration via the links property, which represents a link chain.
This means that the Eden client will execute the links in the order they are added to
the links array when doing a request and will execute them again in reverse
when it's handling a response.

Here's a visual representation of the link chain:

<div align="center" style="marginBottom: 12px">
  <img src="/assets/links-diagram.svg" alt="Eden Links Diagram"/>
  <small>
    <span>Eden Link Diagram. Based on </span>
    <a href="https://trpc.io/docs/client/links" target="_blank">tRPC's </a>,
    <span>which was based on </span>
    <a href="https://www.apollographql.com/docs/react/api/link/introduction/" target="_blank">Apollo's</a>.
  </small>
</div>

```typescript twoslash
import { createEdenTreatyReactQuery, httpLink, loggerLink } from '@ap0nia/eden-react-query'

const eden = createEdenTreatyReactQuery()

const domain = `http://localhost:3000`

const clientOne = eden.createClient({
  links: [loggerLink(), httpLink({ domain })],
})
```

## Creating a custom link

A link is a function that follows the `EdenLink` type. Each link is composed of three parts:

1. The link returns a function that has a parameter with the `EdenClientRuntime` type.
   This argument is passed by tRPC and it is used when creating a [**terminating link**](#the-terminating-link).
   If you're not creating a terminating link, you can just create a function that has no parameters.
   In such case, the link should be added to the `links` array without invoking (`links: [..., myLink, httpBatchLink(...)]`).
2. The function in step 1 returns another function that receives an object with two properties:
   `operation` which is the `Operation` that is being executed by the client,
   and `next` which is the function we use to call the next link down the chain.
3. The function in step 2 returns a final function that returns the `observable` function provided by `@elysjs/eden`.
   The `observable` accepts a function that receives an `observer` which helps our link
   notify the next link up the chain how they should handle the operation result.
   In this function, we can just return `next(operation)` and leave it as is, or we can subscribe to `next`,
   which enables our link to handle the operation result.

### Example

<!-- -->
<template>

```typescript twoslash include links-basic-application
import { Elysia, t } from 'elysia'

export const app = new Elysia().get('/', () => 'Hello, World!')

export type App = typeof app
```

</template>

::: code-group

```typescript twoslash [index.ts]
// @filename: server.ts
// @include: links-basic-application

// @filename: index.ts
// ---cut---
import { EdenLink, Observable } from '@ap0nia/eden-react-query'
import type { App } from './server'

export const customLink: EdenLink<App> = () => {
  // Here we just got initialized in the app - this happens once per app.
  // Useful for storing cache for instance.
  return ({ next, operation }) => {
    // This is when passing the result to the next link.
    // Each link needs to return an observable which propagates results.
    return new Observable((observer) => {
      console.log('performing operation:', operation)

      const unsubscribe = next(operation).subscribe({
        next(value) {
          console.log('we received value', value)
          observer.next(value)
        },
        error(err) {
          console.log('we received error', err)
          observer.error(err)
        },
        complete() {
          observer.complete()
        },
      })

      return unsubscribe
    })
  }
}
```

```typescript twoslash [server.ts]
// @include: links-basic-application
```

:::

### References

If you need a more real reference for creating your custom link,
you can check out some of the built-in links this Eden implementation provides at
[GitHub](https://github.com/ap0nia/eden-query/tree/main/packages/eden/src/links).

## The terminating link

The **terminating link** is the last link in a link chain.
Instead of calling the `next` function, the terminating link is responsible for
sending your composed tRPC operation to the tRPC server and resolving the response.

The `links` array that you add to the eden `createClient` call should have at least one **_terminating_** link.
If `links` don't have a terminating link at the end of them, the eden client will not be able to resolve requests.

[`httpBatchLink`](./http-batch-link.md) is the recommended terminating link by tRPC.

[`httpLink`](./http-link.md) is another other examples of terminating links.

## TODO

> These links haven't been replicated from tRPC yet...

- HTTP Batch Stream Link
- HTTP Subscription Link
- WebSocket Link

## Managing context

As an operation moves along your link chain, it maintains a context that each link can read and modify.
This allows links to pass metadata along the chain that other links use in their execution logic.

Obtain the current context object and modify it by accessing `operation.context`.

You can set the context object's initial value for a particular operation by providing the
context parameter to the `query` or `useQuery` hook (or `mutation`, `subscription`, etc.).

For an example use case, see
[Disable batching for certain requests](./split-link#disable-batching-for-certain-requests).

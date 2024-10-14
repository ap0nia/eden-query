---
title: Batching Eden-Query - ElysiaJS
head:
  - - meta
    - property: 'og:title'
      content: Batching Eden-Query - ElysiaJS

  - - meta
    - name: 'description'
      content: >
        Experiemental batching implementation for Eden and Tanstack-Query integration.

  - - meta
    - property: 'og:description'
      content: >
        Experimental batching implementation for Eden and Tanstack-Query integration.
---

# Batching (experimental)

A custom plugin allows requests from the client to be combined into one single request.
This has to be enabled on the server, and the client application can use it via a batch client.

## Example Usage

### Elysia Server Application

::: code-group

```typescript twoslash include eq-batching-application [server.ts]
import { Elysia, t } from 'elysia'
import { batchPlugin, edenPlugin } from '@ap0nia/eden-react-query/server'

/**
 * Option 1: Use the eden plugin and opt into batching.
 * This is the recommended way because eden plugin will apply all desired plugins,
 * e.g. batch and transform, in the correct order and in a single plugin call.
 */
const app = new Elysia()
  .use(edenPlugin({ batch: true }))
  .get('/a', () => 'A')
  .get('/b', () => 'B')

/**
 * Option 2: Use the batchPlugin directly.
 */
const app1 = new Elysia()
  .use(batchPlugin())
  .get('/a', () => 'A')
  .get('/b', () => 'B')

/**
 * Both plugins also accept an object with options for batching.
 */
const app2 = new Elysia()
  .use(edenPlugin({ batch: { endpoint: '/api/batch' } }))
  .get('/a', () => 'A')
  .get('/b', () => 'B')

export type App = typeof app
```

:::

### Eden-Query Batch Client

::: code-group

```typescript twoslash [index.ts]
// @filename: server.ts
// @include: eq-batching-application

// @filename: index.ts
// ---cut---
import { createEdenTreatyReactQuery } from '@ap0nia/eden-react-query'
import type { App } from './server'

const eden = createEdenTreatyReactQuery<App>()

const client = eden.createHttpBatchClient()
```

:::

## Options

### Method

The method to use for the batch request. `GET` or `POST`

### Endpoint

Where the batch endpoint is. Default `/batch`

### Transformer

[Data Transformer](https://trpc.io/docs/server/data-transformers) to handle a request's body (if any).

### Domain

Basically prefix to the endpoint. e.g. "http://localhost:3000"

## How it Works

### Elysia.js Plugin

The batch plugin adds a new endpoint and handler to the elysia application that is invisible thanks to the type definition.
This is `/batch` by default, and can be changed via the `endpoint` option.

### HttpBatchLink Timeout

If using the `httpBatchLink`, a function kind of like `setTimeout(() => {}, 0)` is used to
wait and capture all requests made in the same event loop, adding them to an array, before
a single batch request is made that combines all the request information.

:::info
A batch request is only made if multiple requests are actually found in the array,
otherwise a regular request made to the indicated endpoint is done.
:::

### Method

Batch requests are `GET` or `POST` requests, where the information of all batched requests
is either captured in the request query (URLSearchParams) or request body (FormData) respectively.

By default, `POST` requests are used since it will work the most consistently for encoding
request information.

### Information Captured

The following information is encoded in either the request query or body for every request
during a batch request.

#### Method

The method for the particular request.

:::warning
If you specify `GET` as the batch method, but one of the individual requests specifically
indicates a `POST` method, the batch handler will make a `POST` batch request.
:::

#### Query

If using the `GET` method for batch requests, queries for the particular request will be
denoted with the following syntax: `0.query.queryKey=queryValue` in the request URL.

The first segment represents the index of the request that the query corresponds to,
`query` indicates that the following segments are part of a query for that request,
and `queryKey` and `queryValue` are the original query key and value.

If using the `POST` method for batch requests, it will be included in the `FormData` `body`,
e.g. `body.append('0.query.queryKey', 'queryValue')`.

**_Basic Example_**

> These examples only show the `query` property being encoded in the batch request, not necessarily the other properties.

Request 1: `http://localhost:3000/users?firstname=a`

Request 2: `http://localhost:3000/users?lastname=b`

<hr>

Batch Request (GET):

`http://localhost:3000/batch?0.query.users.firstname=a&1.query.users.lastname=b`

Batch Request (POST):

```typescript
const body = new FormData()

body.append('0.path', 'users')
body.append('0.query.firstname', 'a')
body.append('1.path', 'users')
body.append('1.query.lastname', 'b')

const request = new Request('http://localhost:3000/batch', { body })
```

---
title: Transformers Eden-Query - ElysiaJS
head:
  - - meta
    - property: 'og:title'
      content: Transformers for Eden and Tanstack-Query integration.

  - - meta
    - name: 'description'
      content: Transformers for Eden and Tanstack-Query integration.

  - - meta
    - property: 'og:description'
      content: Transformers for Eden and Tanstack-Query integration.
---

# Transformers

> Refer to [tRPC's documentation on transformers](https://trpc.io/docs/server/data-transformers)
> for more in-depth information.

You are able to serialize the response data & input args. The transformers need to be added both to the server and the client.

## Using [superjson](https://github.com/blitz-js/superjson)

SuperJSON allows us to transparently use, e.g., standard `Date`/`Map`/`Set`s over the wire between the server and client.
That is, you can return any of these types from your API-resolver and use them in the client without having to recreate the objects from JSON.

### Steps

#### 1. Install superjson

```sh npm2yarn
yarn add superjson
```

#### 2. Add SuperJSON via the `transformPlugin` to your Elysia.js server application.

```typescript twoslash include elysia
import { Elysia, t } from 'elysia'
import { transformPlugin } from '@ap0nia/eden-react-query'
import SuperJSON from 'superjson'

const app = new Elysia()
  .use(transformPlugin(SuperJSON))
  .get('/a', () => 'A')
  .get('/b', () => 'B')

export type App = typeof app
```

#### 3. Create a client with links, e.g. `httpLink()`, `httpBatchLink()`, etc

> TypeScript will guide you to where you need to add `transformer` as soon as you've added it your server application via the `transformPlugin` helper.

```typescript twoslash
// @filename: server.ts
// @include: elysia

// @filename: index.ts
// ---cut---
import { createEdenTreatyReactQuery, httpLink } from '@ap0nia/eden-react-query'
import SuperJSON from 'superjson'
import type { App } from './server'

const eden = createEdenTreatyReactQuery<App>()

export const client = eden.createClient({
  links: [
    httpLink({
      domain: 'http://localhost:3000',
      transformer: SuperJSON,
    }),
  ],
})
```

## Different transformers for upload and download

If a transformer should only be used for one direction or different transformers
should be used for upload and download (e.g., for performance reasons),
you can provide individual transformers for upload and download.
Make sure you use the same combined transformer everywhere.

### Steps

Here [superjson](https://github.com/blitz-js/superjson) is used for uploading and
[devalue](https://github.com/Rich-Harris/devalue) for downloading data because devalue
is a lot faster but insecure to use on the server.

#### 1. Install

```bash npm2yarn
yarn add superjson devalue
```

#### 2. Add to `utils/eden.ts`

```typescript twoslash
import { uneval } from 'devalue'
import SuperJSON from 'superjson'
import type { DataTransformerOptions } from '@ap0nia/eden-react-query'

export const transformer: DataTransformerOptions = {
  input: SuperJSON,
  output: {
    serialize: (object) => uneval(object),
    // This `eval` only ever happens on the **client**
    deserialize: (object) => eval(`(${object})`),
  },
}
```

#### 3. Add the transformer via the `transformPlugin` to your Elysia.js server application.

```typescript twoslash
// @filename: utils/eden.ts
import { uneval } from 'devalue'
import SuperJSON from 'superjson'
import type { DataTransformerOptions } from '@ap0nia/eden-react-query'

export const transformer: DataTransformerOptions = {
  input: SuperJSON,
  output: {
    serialize: (object) => uneval(object),
    // This `eval` only ever happens on the **client**
    deserialize: (object) => eval(`(${object})`),
  },
}

// @filename: src/routers/_app.ts
// ---cut---
import { createEdenTreatyReactQuery, httpLink } from '@ap0nia/eden-react-query'
import { transformer } from '../../utils/eden'

export const eden = createEdenTreatyReactQuery()

export const client = eden.createClient({
  links: [httpLink({ transformer })],
})
```

## `DataTransformer` interface

```ts
export interface DataTransformer {
  serialize(object: any): any
  deserialize(object: any): any
}

interface InputDataTransformer extends DataTransformer {
  /**
   * This function runs **on the client** before sending the data to the server.
   */
  serialize(object: any): any
  /**
   * This function runs **on the server** to transform the data before it is passed to the resolver
   */
  deserialize(object: any): any
}

interface OutputDataTransformer extends DataTransformer {
  /**
   * This function runs **on the server** before sending the data to the client.
   */
  serialize(object: any): any
  /**
   * This function runs **only on the client** to transform the data sent from the server.
   */
  deserialize(object: any): any
}

export interface CombinedDataTransformer {
  /**
   * Specify how the data sent from the client to the server should be transformed.
   */
  input: InputDataTransformer
  /**
   * Specify how the data sent from the server to the client should be transformed.
   */
  output: OutputDataTransformer
}
```

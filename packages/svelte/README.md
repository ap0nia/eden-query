# @ap0nia/eden-query

> @elysiajs/eden + @tanstack-svelte-query integration

## Quick Start

1. Install this library.

```sh
pnpm install @ap0nia/eden-svelte-query
```

2. Initialize a new eden-svelte-query instance.

```ts
// src/lib/eden.ts

import { createEdenTreatyQuery } from '@ap0nia/eden-query'
import type { App } from '$lib/server'

export const eden = createEdenTreatyQuery<App>()
```

3. Initialize svelte-query and set the eden-svelte-query context.

```html
<script>
  // src/routes/+layout.svelte

  import { QueryClient, QueryClientProvider } from '@tanstack/svelte-query'
  import { eden } from '$lib/eden'

  const queryClient = new QueryClient()

  eden.setContext(queryClient)
</script>

<QueryClientProvider client="{queryClient}">
  <slot />
</QueryClientProvider>
```

- Setting up the `QueryClientProvider` is required for svelte-query.
- Setting the eden-svelte-query context allows `eden.useContext()` function to use the correct queryClient.

4. Create a query, a mutation, and an invalidation function.

```html
<script>
  // src/routes/+page.svelte

  import { eden } from '$lib/eden'

  let newGreeting = ''

  const utils = eden.getContext()

  const greeting = eden.api.greeting.get.createQuery({})

  const mutateGreeting = eden.api.greeting.post.createMutation()

  async function changeGreeting() {
    const result = await $mutateGreeting.mutateAsync(newGreeting)
    console.log('mutation result: ', result)
    await utils.api.greeting.get.invalidate()
  }
</script>

<div>
  <p>The message is: {$greeting.data}</p>

  <label>
    <p>New Greeting</p>
    <input bind:value="{newGreeting}" type="text" />
  </label>

  <button on:click="{changeGreeting}">Change Greeting</button>
</div>
```

> Important Notes

- `greeting` updates with the value of the most currently fetched greeting.
- `mutateGreeting` is a mutation that can be used to make `POST` requests to update the greeting on the server.
- `utils` exposes a treaty-like interface with utilities like invalidating, fetch, pre-fetching, etc.
- `invalidating` a route will cause any queries on that route to be refetched.
  e.g. since `api.greeting.get` was invalidated, the `api.greeting.get.createQuery` store will be refetched.

### SvelteKit + Elysia.js implementation details

Initialize the elysia server.

```ts
// src/lib/server/index.ts

import { t, Elysia } from 'elysia'

let greeting = 'Hello, World!'

export const app = new Elysia({ prefix: '/api' })
  .get('/greeting', () => greeting)
  .post(
    '/greeting',
    (context) => {
      console.log('Received new greeting: ', context.body)
      greeting = context.body
      return 'OK'
    },
    {
      body: t.String(),
    },
  )

export type App = typeof app
```

Add a catch-all server route for the Elysia app to handle requests.

```ts
// src/routes/api/[...elysia]/+server.ts

import type { RequestHandler } from '@sveltejs/kit'
import { app } from '$lib/server'

const handler: RequestHandler = async (event) => await app.handle(event.request)

export const GET = handler
export const POST = handler
export const PUT = handler
export const PATCH = handler
export const DELETE = handler
```

## Implementation Details

### Runtime

#### eden treaty + @tanstack/query

The main components of the runtime implementation include:

- the proxy that reads the route and generates options for `createQuery` and `createMutation`
- links
- resolving requests

#### Proxy

The main helper is made of three components.

- Root: The treaty API with `createQuery`, `createMutation`, etc. as leaves.
- Base: Additional helpers at the root, like `setContext`, `getContext` that aren't part of the treaty API.
- Context: Available from the base as `getContext`, and exposes helper utilities like `invalidate`.

> Type Interfaces Example

```ts
import type {
  CreateQueryOptions,
  CreateQueryResult,
  InvalidateOptions,
  QueryClient,
} from '@tanstack/svelte-query'
import { Elysia } from 'elysia'

const app = new Elysia().get('/a', () => 123).get('/b', () => 'B')

type TreatyQueryRoot = {
  a: {
    get: (input: {}, options?: CreateQueryOptions) => CreateQueryResult<number>
  }
  b: {
    get: (input: {}, options?: CreateQueryOptions) => CreateQueryResult<string>
  }
}

type TreatyQueryBase = {
  setContext: (queryClient: QueryClient) => void
  getContext: () => TreatyQueryContext
}

type TreatyQueryContext = {
  a: {
    invalidate: (input: {}, options?: InvalidateOptions) => Promise<void>
    // ...
  }
  b: {
    invalidate: (input: {}, options?: InvalidateOptions) => Promise<void>
    // ...
  }
}

// The entire API integration...
type TreatyQuery = TreatyQueryRoot & TreatyQueryBase & TreatyQueryContext
```

> Building from Scratch

A proxy that accumulates routes can be created with a couple of simple steps.

1. Create an object interface that represents your desired proxy.
2. Create a nested proxy that reads the routes, and terminates when it's called like function.

```ts
type MyProxyInterface = {
  a: {
    b: {
      c: () => any
    }
  }
}

function createQueryOptions(path: string, options: any) {
  console.log('Creating query options with path and options: ', { path, options })

  return {
    queryKey: [path],
    queryFn: async () => {
      const response = await fetch(path, options)
      const data = await response.json()
      return data
    }
  }
}

function createProxy(paths: any[] = []): any {
  return new Proxy(() => {
    get: (_target, path) => {
      return createProxy([...paths, path])
    },
    apply: (_target, _thisArg, args) => {
      const path = paths.join('/')

      // When a property is called like a function, returns another function.
      return (options: any) => createQueryOptions(path, options)
    }
  })
}

const myProxyImplementation: MyProxyInterface = createProxy()

// Returns function
const makeRequest = myProxyImplementation.a.b.c()

// Make the call.
const resolvedRequest = makeRequest()
```

> [!NOTE]
> The goal for this proxy is that accessing (i.e. "get-ing") a property will return a new nested proxy,
> while calling it like function will simply return the joined path.

> [!IMPORTANT]
> The proxy itself only has two behaviors whenever a property is accessed:
>
> 1. If not called like a function, return a nested proxy.
> 2. If called like a function, resolves the path, and returns another function.
>    The functionality of the latter is allows options to be pre-generated for `createQuery` and `createMutation`.
>
> In the example above the path is calculated and captured in a closure before returning a simpler function.
> The proxy's usage is logically defined by the type interface, but during runtime it can be used
> in any way, e.g. `myProxyImplementation.x.y.z()` and it would work the same, despite not being defined in the types.

#### Proxy Query Options

Now that we know how the proxy conceptually works in generating options for a function call,
capturing them in a closure, before returning a "simplified" function, this is an example of how it
works with `@tanstack/query`.

```ts
import type { CreateQueryOptions, CreateQueryResult } from '@tanstack/svelte-query'

type EdenQueryRequestOptions = {
  abortOnUnmount?: boolean
}

type EdenCreateQueryOptions = CreateQueryOptions & {
  /**
   * Special property for holding fetch-related options.
   */
  eden?: EdenQueryRequestOptions
}

type MyInput = {
  query: {
    message: string
  }
}

type MyProxyInterface = {
  a: {
    b: {
      c: (input: MyInput, options?: EdenCreateQueryOptions) => CreateQueryResult<number>
    }
  }
}

function createQueryOptions(paths: string[], input: any, options: EdenCreateQueryOptions = {}) {
  const path = paths.join('/')

  const { eden, ...queryOptions } = options

  const abortOnUnmount = Boolean(eden?.abortOnUnmount)

  return createQuery({
    queryKey: [paths, { type: 'query', input: input }],
    queryFn: async (context) => {
      const fetchInit = { ...options }

      if (abortOnUnmount) {
        fetchInit.signal = context.signal
      }

      const endpoint = '/' + paths.join('/')

      const response = await fetch(endpoint, fetchInit)

      const data = await response.json()

      return data
    }
    ...queryOptions
  })
}

function createProxy(paths: any[] = []): any {
  return new Proxy(() => {
    get: (_target, path) => {
      return createProxy([...paths, path])
    },
    apply: (_target, _thisArg, args) => {
      return (input: any, options: EdenCreateQueryOptions) => createQueryOptions(paths, input, options)
    }
  })
}
```

#### Links

Links are an abstraction layer over the request resolution and are inspired by [tRPC links](https://trpc.io/docs/client/links).

Basically, instead of using `fetch` directly, a `client` is created and a request is made by
doing `client.query`.

Links are functions that accept configuration options and return an observable object.

The `EdenClient` accepts an array of links and iterates over the observables.

##### EdenClient

Links are managed by a client. To make a request, `EdenClient.query` or `EdenClient.mutation` is invoked, after which
the links are iterated in order to perform the request.

##### HTTP Link

The library exposes a factory, `httpLink` which is a function that returns a function that
returns a function that returns an observable.

> [!NOTE]
> For better or worse, this is the nested function architecture being used by tRPC.
>
> `httpLinkFactory` (factory that makes factories) -> `EdenLink` (a factory) ->
> Call with runtime options -> `OperationLink` -> Call with operation arguments -> `Observable`
>
> The first call is made by the developer to initialize it.
> The second call is made by the `EdenClient` in its constructor.
> Finally, whenever the `EdenClient` uses the `OperationLink`, it passes all the arguments
> for the request, and gets an observable that resolves when the request is done.

The default `httpLink` factory is made with the `universalRequester`, which is derived
from the IIFE function used by the official `@elysiajs/eden` [treaty implementation](https://github.com/elysiajs/eden/blob/main/src/treaty2/index.ts#L265).

Using an HTTP Link.

```ts
import { EdenClient, httpLink } from '@ap0nia/eden-svelte-query'

const client = new EdenClient({
  links: [httpLink()],
})

const result = await client.query({ endpoint: '/api/a/b' })

console.log('result: ', result)
```

##### HTTP Batch Link

The HTTP Batch link is an experimental, WIP feature that adds a wrapper around the `universalRequester`
that internally invokes `setTimeout` to batch all requests that are made in the same event loop.

In order for it to work, an `elysia` plugin must also be used on the server to handle the batch requests.

There are two main modes.

- POST: The batched request and response data is encoded in `FormData`.
- GET: The batch request data is encoded in JSON in the URL query params, and the batch response data is encoded in JSON.

### TypeScript

An Elysia.js app looks like this:

```ts
import Elysia from 'elysia'

const app = new Elysia().get('/a/b', () => 'ab').post('/a/b/c', () => 'abc')

const routes: Routes = app._routes

type Routes = {
  a: {
    b: {
      c: {
        post: {
          body: unknown
          params: Record<never, string>
          query: unknown
          headers: unknown
          response: {
            200: string
          }
        }
      }
      get: {
        body: unknown
        params: Record<never, string>
        query: unknown
        headers: unknown
        response: {
          200: string
        }
      }
    }
  }
}
```

The most important thing is the `_routes` property that represents the available routes as nested objects.

#### Key Points in Elysia.js TS Routes

1. Every key has a nested object.
2. The nested object may be a `RouteSchema`. A `RouteSchema` looks like `{ body: unknown, response: { 200: string } }`.
3. If the nested object is a `RouteSchema`, then the key represents the method. For example, `get`, or `post`.
4. A `RouteSchema` represents a leaf, and you should stop "recurring". Otherwise, it's a nested route.

#### Mapping Elysia.js TS Routes

1. Write a mapped type that converts leaf nodes to something else. (Using the same app type above as an example).

```ts
import { Elysia, type RouteSchema } from 'elysia'

const app = new Elysia().get('/a/b', () => 'ab').post('/a/b/c', () => 'abc')

type App = typeof app

type MappedElysia<T> = {
  [K in keyof T]: T[K] extends RouteSchema ? 'Leaf Node' : MappedElysia<T[K]>
}

type MappedApp = MappedElysia<App>
```

2. Since we know that leaf nodes are `RouteSchema`, try writing another type to transform it.

```ts
import { Elysia, type RouteSchema } from 'elysia'

const app = new Elysia().get('/a/b', () => 'ab').post('/a/b/c', () => 'abc')

type App = typeof app

type MappedElysiaLeaf<
  TMethod extends PropertyKey,
  TRoute extends RouteSchema,
> = TMethod extends 'get'
  ? { method: 'GET'; route: TRoute }
  : TMethod extends 'post'
  ? { method: 'POST'; route: TRoute }
  : { method: 'N/A'; route: TRoute }

type MappedElysia<T> = {
  [K in keyof T]: T[K] extends RouteSchema ? MappedElysiaLeaft<K, T[K]> : MappedElysia<T[K]>
}

type MappedApp = MappedElysia<App>
```

> [!NOTE]
> Here, the `MappedElysiaLeaf` gets both the `TMethod` and `TRoute` from its parent, which
> is provided by the parent `MappedElysia`. This is important for integration with `@tanstack/query`
> because `GET` requests are eligible for `createQuery` calls, while all other types are
> eligible for `createMutation`.

3. Finally, we can provide rough type-safety for a `@tanstack/query`.

```ts
import type { CreateQueryResult, CreateMutationResult } from '@tanstack/svelte-query'
import { Elysia, type RouteSchema } from 'elysia'

const app = new Elysia().get('/a/b', () => 'ab').post('/a/b/c', () => 'abc')

type App = typeof app

type InferRouteInput<T extends RouteSchema> = {
  params: T['params']
  query: T['query']
  body: T['body']
}

type MappedElysiaLeaf<
  TMethod extends PropertyKey,
  TRoute extends RouteSchema,
> = TMethod extends 'get'
  ? CreateQueryResult<InferRouteInput<TRoute>>
  : CreateMutationResult<InferRouteInput<TRoute>>

type MappedElysia<T> = {
  [K in keyof T]: T[K] extends RouteSchema ? MappedElysiaLeaft<K, T[K]> : MappedElysia<T[K]>
}

type MappedApp = MappedElysia<App>

// Result!

let eden: MappedApp = {} as any

// type-safe!

eden.a.b.get.createQuery

eden.a.b.c.post.createMutation
```

> [!NOTE]
> Here, we iterate over all nested routes, and handle leaf nodes differently.
> If the key for a route is 'get', then it would be mapped to `createQuery`, otherwise `createMutation`

> [!IMPORTANT]
> Please note, there are **_three_** sources of inputs: route params, query params, and request body.
> That's why there's a helper method called `InferRouteInput<T extends RouteSchema>` which recognizes
> the different sources of inputs and omits any unneeded inputs. It's been simplified in this demonstration.

## Remarks

Ideas for batching:

https://learn.microsoft.com/en-us/sharepoint/dev/sp-add-ins/make-batch-requests-with-the-rest-apis

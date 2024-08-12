---
title: Aborting Eden-React-Query - ElysiaJS
head:
  - - meta
    - property: 'og:title'
      content: Aborting Eden-React-Query - ElysiaJS

  - - meta
    - name: 'description'
      content: Aborting Eden-React-Query - ElysiaJS

  - - meta
    - property: 'og:description'
      content: Aborting Eden-React-Query - ElysiaJS
---

# Aborting

By default, Eden-Query does not cancel requests via React Query.
If you want to opt into this behaviour, you can provide `abortOnUnmount` in your configuration.

:::info
@tanstack/react-query only supports aborting queries.
:::

:::tip
Although this property is named `abortOnUnmount`, it actually means "forward signal from tanstack-query".
tanstack-query's signal facilitates **_additional_** functionality such as cancelling requests
if there's already a duplicate in-progress.
This has been discussed within tRPC [here](https://github.com/trpc/trpc/issues/4448).
:::

<template>

```typescript twoslash include react-aborting-application
import { Elysia, t } from 'elysia'
import { batchPlugin } from '@ap0nia/eden-react-query'

export const app = new Elysia().use(batchPlugin()).get('/post/:id', (context) => {
  return {
    id: context.params.id,
    title: 'Look me up!',
  }
})

export type App = typeof app
```

```typescript twoslash include react-aborting-eden
// @noErrors
import { createEdenTreatyReactQuery, httpBatchLink } from '@ap0nia/eden-react-query'
import type { App } from '../server'

export const eden = createEdenTreatyReactQuery<App>()

export const client = eden.createClient({
  links: [
    httpBatchLink({
      domain: 'http://localhost:3000',
    }),
  ],
})
```

</template>

### Globally

::: code-group

```typescript twoslash [src/lib/eden.ts]
// @filename: src/server.ts
// @include: react-aborting-application

// @filename: src/lib/eden.ts
// ---cut---
import { createEdenTreatyReactQuery, httpBatchLink } from '@ap0nia/eden-react-query'
import type { App } from '../server'

export const eden = createEdenTreatyReactQuery<App>({
  abortOnUnmount: true,
})

export const client = eden.createClient({
  links: [
    httpBatchLink({
      domain: 'http://localhost:3000',
    }),
  ],
})
```

```typescript twoslash [src/server.ts]
// @include: react-aborting-application
```

:::

### Per-request

You may also override this behaviour at the query level.

::: code-group

```typescript twoslash [src/components/MyComponent.tsx]
// @filename: src/server.ts
// @include: react-aborting-application

// @filename: src/lib/eden.ts
// ---cut---
// @include: react-aborting-eden

// @filename: use-router.d.ts
// ---cut---
declare const useRouter: any

// @filename: src/components/MyComponent.tsx
// ---cut---
// @noErrors
import React from 'react'
import { eden } from '../lib/eden'

function PostViewPage() {
  const { query } = useRouter()

  const postQuery = eden.post[':id'].get.useQuery(
    {
      query: { id: query.id },
    },
    { eden: { abortOnUnmount: true } },
  )

  // ...
}
```

```typescript twoslash [src/lib/eden.ts]
// @filename: src/server.ts
// @include: react-aborting-application

// @filename: src/lib/eden.ts
// ---cut---
// @include: react-aborting-eden
```

```typescript twoslash [src/server.ts]
// @include: react-aborting-application
```

:::

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

### Elysia Server Application

::: code-group

```typescript twoslash include eq-react-aborting-application [server.ts]
import { Elysia, t } from 'elysia'
import { batchPlugin } from '@ap0nia/eden-react-query/server'

export const app = new Elysia().use(batchPlugin()).get('/post/:id', (context) => {
  return {
    id: context.params.id,
    title: 'Look me up!',
  }
})

export type App = typeof app
```

:::

### EdenClient

::: code-group

```typescript twoslash [eden.ts]
// @filename: server.ts
// ---cut---
// @include: eq-react-aborting-application

// @filename: eden.ts
// ---cut---
import { createEdenTreatyReactQuery } from '@ap0nia/eden-react-query'
import type { App } from './server'

export const eden = createEdenTreatyReactQuery<App>()
```

### Globally

::: code-group

```typescript twoslash [eden.ts]
// @filename: server.ts
// @include: eq-react-aborting-application

// @filename: eden.ts
// ---cut---
import { createEdenTreatyReactQuery } from '@ap0nia/eden-react-query'
import type { App } from './server'

export const eden = createEdenTreatyReactQuery<App>({
  abortOnUnmount: true,
})
```

:::

### Per-request

You may also override this behaviour at the query level.

::: code-group

```typescript twoslash [index.tsx]
// @filename: server.ts
// @include: eq-react-aborting-application

// @filename: eden.ts
// ---cut---
import { createEdenTreatyReactQuery } from '@ap0nia/eden-react-query'
import type { App } from './server'

export const eden = createEdenTreatyReactQuery<App>({
  abortOnUnmount: true,
})

// @filename: use-router.d.ts
// ---cut---
declare const useRouter: any

// @filename: index.tsx
// ---cut---
// @noErrors
import React from 'react'
import { eden } from './eden'

function PostViewPage() {
  const { query } = useRouter()

  const postQuery = eden.post({ id: query.id }).get.useQuery(
    undefined,
    { eden: { abortOnUnmount: true } },
  )

  // ...
}
```

:::

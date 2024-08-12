---
title: Disabling Eden-React-Query - ElysiaJS
head:
  - - meta
    - property: 'og:title'
      content: Disabling Eden-React-Query - ElysiaJS

  - - meta
    - name: 'description'
      content: Disabling Eden-React-Query - ElysiaJS

  - - meta
    - property: 'og:description'
      content: Disabling Eden-React-Query - ElysiaJS
---

# Disabling

<template>

```typescript twoslash include react-disabling-application
import { Elysia, t } from 'elysia'
import { batchPlugin } from '@ap0nia/eden-react-query'

export const app = new Elysia().use(batchPlugin()).get('/user/:name', (context) => {
  return {
    name: context.params.name,
  }
})

export type App = typeof app
```

```typescript twoslash include react-disabling-eden
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

To disable queries, you can pass `skipToken` as the first argument to `useQuery` or `useInfiniteQuery`. This will prevent the query from being executed.

### Typesafe conditional queries using `skipToken`

::: code-group

```typescript twoslash [src/components/MyComponent.tsx]
// @filename: src/server.ts
// @include: react-disabling-application

// @filename: src/lib/eden.ts
// ---cut---
// @include: react-disabling-eden

// @filename: src/components/MyComponent.tsx
// ---cut---
import React, { useState } from 'react'
import { skipToken } from '@tanstack/react-query'
import { eden } from '../lib/eden'

export function MyComponent() {
  const [name, setName] = useState<string | undefined>()

  const result = eden.user[':name'].get.useQuery(name ? { params: { name } } : skipToken)

  return
}
```

```typescript twoslash [src/lib/eden.ts]
// @filename: src/server.ts
// @include: react-disabling-application

// @filename: src/lib/eden.ts
// ---cut---
// @include: react-disabling-eden
```

```typescript twoslash [src/server.ts]
// @include: react-disabling-application
```

:::

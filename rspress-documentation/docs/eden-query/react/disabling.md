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

### Elysia Server Application

::: code-group

```typescript twoslash include eq-react-disabling-application [server.ts]
import { Elysia, t } from 'elysia'
import { batchPlugin } from '@ap0nia/eden-react-query/server'

export const app = new Elysia().use(batchPlugin()).get(
  '/user',
  (context) => {
    return {
      name: context.query.name,
    }
  },
  {
    query: t.Object({
      name: t.String(),
    }),
  },
)

export type App = typeof app
```

:::

### Eden-Query Client

::: code-group

```typescript twoslash [eden.ts]
// @filename: server.ts
// ---cut---
// @include: eq-react-disabling-application

// @filename: eden.ts
// ---cut---
import { createEdenTreatyReactQuery } from '@ap0nia/eden-react-query'
import type { App } from './server'

export const eden = createEdenTreatyReactQuery<App>()
```

:::

To disable queries, you can pass `skipToken` as the first argument to `useQuery` or `useInfiniteQuery`. This will prevent the query from being executed.

### Typesafe conditional queries using `skipToken`

::: code-group

```typescript twoslash [index.tsx]
// @filename: server.ts
// @include: eq-react-disabling-application

// @filename: eden.ts
// ---cut---
import { createEdenTreatyReactQuery } from '@ap0nia/eden-react-query'
import type { App } from './server'

export const eden = createEdenTreatyReactQuery<App>()

// @filename: index.tsx
// ---cut---
import React, { useState } from 'react'
import { skipToken } from '@tanstack/react-query'
import { eden } from './eden'

export function MyComponent() {
  const [name, setName] = useState<string | undefined>()

  const result = eden.user.get.useQuery(name ? { name } : skipToken)

  result
  //  ^?
}
```

:::

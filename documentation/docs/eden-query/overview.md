---
title: tanstack-query - ElysiaJS
head:
  - - meta
    - property: 'og:title'
      content: End-to-End Type Safety with tanstack-query integrations - ElysiaJS

  - - meta
    - name: 'description'
      content: Integration between Eden and tanstack-query.

  - - meta
    - property: 'og:description'
      content: Integration between Eden and tanstack-query.
---

# Introduction

The goal of eden + tanstack-query is to provide a similar interface to
[tRPC's react-query integration](https://trpc.io/docs/client/react),
while supporting all the functionality provided by the
[official Eden implementation](https://elysiajs.com/eden/overview.html).

## Implementations

eden + tanstack-query aims to offer two implementations/APIs, **treaty** and **fetch**,
just like the official eden library.

### Fetch (WIP)

None of the integrations have implemented this yet...

### Treaty

Based on the [official example of eden treaty](/eden/treaty/overview),
this is how the react-query hooks have been integrated with eden.

```typescript twoslash
// @filename: server.ts
import { Elysia, t } from 'elysia'

const app = new Elysia()
  .get('/', 'hi')
  .get('/users', () => 'Skadi')
  .put('/nendoroid/:id', ({ body }) => body, {
    body: t.Object({
      name: t.String(),
      from: t.String(),
    }),
  })
  .get('/nendoroid/:id/name', () => 'Skadi')
  .listen(3000)

export type App = typeof app

// @filename: index.ts
// ---cut---
import { treaty } from '@elysiajs/eden'
import { createEdenTreatyQuery } from '@elysiajs/eden-react-query'
import type { App } from './server'

export const app = createEdenTreatyQuery<App>({ domain: 'localhost:3000' })

// useQuery + [GET] at '/'
const { data } = await app.index.get.useQuery()

// useMutation + [PUT] at '/nendoroid/:id'
const { data: nendoroid, error, mutate } = await app.nendoroid[':id'].put.useMutation()

// Peform the mutation...
mutate({ name: 'Skadi', from: 'Arknights' }, { params: { id: '1895' } })
```

## Comparison with Eden-Treaty

## Comparison with tRPC

---
title: Elysia.js - Ergonomic Framework for Humans
layout: page
sidebar: false
head:
  - - meta
    - property: 'og:title'
      content: Elysia.js - Ergonomic Framework for Humans

  - - meta
    - name: 'description'
      content: >
        Elysia.js is an ergonomic framework for humans with end-to-end type safety and amazing developer experience.
        Elysia.js is familiar, fast, and provides first class TypeScript support with elegant integrations for many services, including tRPC, Swagger, and WebSockets.
        Elysia.js provides everything you need to build next-generation TypeScript web servers.

  - - meta
    - property: 'og:description'
      content: >
        Elysia.js is an ergonomic framework for humans with end-to-end type safety and amazing developer experience.
        Elysia.js is familiar, fast, and provides first class TypeScript support with elegant integrations for many services, including tRPC, Swagger, and WebSockets.
        Elysia.js provides everything you need to build next-generation TypeScript web servers.
---

<script setup>
    import Landing from '../src/components/landing'
</script>

<Landing>
  <template v-slot:justreturn>

```typescript twoslash
import { Elysia } from 'elysia'

new Elysia()
  .get('/', 'Hello World')
  .get('/json', {
    hello: 'world',
  })
  .get('/id/:id', ({ params: { id } }) => id)
  .listen(3000)
```

  </template>

  <template v-slot:typestrict>

```typescript twoslash
import { Elysia, t } from 'elysia'

new Elysia()
  .post(
    '/profile',
    // ↓ hover me ↓
    ({ body }) => body,
    {
      body: t.Object({
        username: t.String(),
      }),
    },
  )
  .listen(3000)
```

  </template>

  <template v-slot:openapi>

```ts twoslash
// @filename: controllers.ts
import { Elysia } from 'elysia'

export const users = new Elysia().get('/users', 'Dreamy Euphony')

export const feed = new Elysia().get('/feed', ['Hoshino', 'Griseo', 'Astro'])

// @filename: server.ts
// ---cut---
import { Elysia, t } from 'elysia'
import { swagger } from '@elysiajs/swagger'
import { users, feed } from './controllers'

new Elysia()
  .use(swagger())
  .use(users)
  .use(feed)
  .listen(3000)
```

  </template>

<template v-slot:server>

```typescript twoslash
// @filename: server.ts
// ---cut---
// server.ts
import { Elysia, t } from 'elysia'

const app = new Elysia()
  .patch(
    '/user/profile',
    ({ body, error }) => {
      if (body.age < 18) return error(400, 'Oh no')

      if (body.name === 'Nagisa') return error(418)

      return body
    },
    {
      body: t.Object({
        name: t.String(),
        age: t.Number(),
      }),
    },
  )
  .listen(80)

export type App = typeof app
```

  </template>

  <template v-slot:client>

```typescript twoslash
// @errors: 2322 1003
// @filename: server.ts
import { Elysia, t } from 'elysia'

const app = new Elysia()
  .patch(
    '/user/profile',
    ({ body, error }) => {
      if (body.age < 18) return error(400, 'Oh no')

      if (body.name === 'Nagisa') return error(418)

      return body
    },
    {
      body: t.Object({
        name: t.String(),
        age: t.Number(),
      }),
    },
  )
  .listen(80)

export type App = typeof app

// @filename: client.ts
// ---cut---
// client.ts
import { treaty } from '@elysiajs/eden'
import type { App } from './server'

const api = treaty<App>('localhost')

const { data, error } = await api.user.profile.patch({
  name: 'saltyaom',
  age: '21',
})

if (error)
  switch (error.status) {
    case 400:
      throw error.value
                 // ^?

    case 418:
      throw error.value
                 // ^?
  }

data
// ^?
```

  </template>

</Landing>

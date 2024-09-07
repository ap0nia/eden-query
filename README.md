<h1 align="center">eden-query</h1>

> elysia.js-eden + tanstack-query integrations

<div align="center">

![NPM License](https://img.shields.io/npm/l/%40ap0nia%2Feden-svelte-query)
![Publish](https://img.shields.io/github/actions/workflow/status/ap0nia/eden-query/release.yml)
![GitHub Release](https://img.shields.io/github/v/release/ap0nia/eden-query)
![GitHub Repo stars](https://img.shields.io/github/stars/ap0nia/eden-query)
![NPM Downloads](https://img.shields.io/npm/dm/%40ap0nia%2Feden)

</div>

## Get Started

### Installation

```sh
# npm
npm install elysia @ap0nia/eden-react-query

# yarn
yarn add elysia @ap0nia/eden-react-query

# pnpm
pnpm add elysia @ap0nia/eden-react-query
```

### Usage

```tsx
import { eden } from './eden'

export function Products() {
  const { data } = eden.api.products.get.useQuery()

  return (
    <ul>
      {data?.map((product) => (
        <li id={product.id}>{product.name}</li>
      )}
    </ul>
  )
}
```

<details>
  <summary>eden.ts</summary>

```tsx
import type { App } from './server'
import { createEdenTreatyReactQuery } from '@ap0nia/eden-react-query'

export const eden = createEdenTreatyReactQuery<App>()
```

</details>

<details>
  <summary>server.ts</summary>

```tsx
import { Elysia } from 'elysia'

const app = new Elysia().get('/api/products', () => {
  return [
    {
      id: 0,
      name: 'Product 0',
    },
    {
      id: 1,
      name: 'Product 1',
    },
    {
      id: 2,
      name: 'Product 2',
    },
  ]
})

export type App = typeof app
```

</details>

## Overview

## Core Technologies

`eden-query` is a combination of three technologies:

**_Elysia.js_**

TypeScript server framework supercharged by Bun with End-to-End Type Safety,
unified type system, and outstanding developer experience.
Learn more about it from [the official documentation](https://elysiajs.com)!

**_Eden_**

A type-safeREST client that offers end-to-end typesafety.
Learn more about it from [the official documentation](https://elysiajs.com/eden/overview.html)!

**_Tanstack-Query_**

A full featured asynchronous state management solution.
Learn more about it from [the offical documentation](https://tanstack.com/query/latest)

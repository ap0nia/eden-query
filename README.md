<h1 align="center">eden-query</h1>

> elysia.js-eden + tanstack-query integrations

<div align="center">

![GitHub Release Workflow](https://img.shields.io/github/actions/workflow/status/ap0nia/eden-query/release.yml?style=flat-square)
![GitHub Repo stars](https://img.shields.io/github/stars/ap0nia/eden-query?style=flat-square)
![GitHub last commit](https://img.shields.io/github/last-commit/ap0nia/eden-query?style=flat-square)

</div>

<div align="center">

![NPM Version](https://img.shields.io/npm/v/%40ap0nia%2Feden?style=flat-square)
![NPM License](https://img.shields.io/npm/l/%40ap0nia%2Feden-svelte-query?style=flat-square)
![NPM Downloads](https://img.shields.io/npm/dm/%40ap0nia%2Feden?style=flat-square)

</div>

<div align="center">

[![codecov](https://codecov.io/github/ap0nia/eden-query/branch/eden-tests/graph/badge.svg?token=PZD53QOA9D)](https://codecov.io/github/ap0nia/eden-query)

</div>

## 📋 Overview

`eden-query` allows you to connect to your `elysia` backend with end-to-end type-safety and powerful
asynchronous state management from your frontend.

### Features

- 🌎 Framework agnostic.
- 🦺 Full end-to-end type-safety.
- ✅ Fully supports REST API standards.
- 🖥️SSR support and examples.
- ✨ Reactive and infinite queries.
- ⚡ Batching requests on both the client and server.
- 🔗 Links for customizing the flow of data.
- 👀 Data transformers for enhanced JSON handling.

## 🚀 Get Started

### Installation

```sh
# npm
npm install elysia @ap0nia/eden-react-query

# yarn
yarn add elysia @ap0nia/eden-react-query

# pnpm
pnpm add elysia @ap0nia/eden-react-query
```

### Usage (React)

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

### Framework Integrations

More documentation for framework-specific packages can be found in their respective project
directories as well as the documentation.

- [React](./packages/eden-react-query)
- [Svelte](./packages/eden-svelte-query)

### General Purpose Integrations

- [Eden](./packages/eden)

A custom implementation of the `eden` client is maintained here with the same core functionality
as the [officially documented one](https://elysiajs.com/eden/overview.html).

## 📖 Learn More

To see more advanced examples and usage of the integration, read [the full documentation](ap0nia.github.io/eden-query).

### Core Technologies

`eden-query` is a combination of three technologies:

_*Elysia.js*_

TypeScript server framework supercharged by Bun with End-to-End Type Safety,
unified type system, and outstanding developer experience.
Learn more about it from [the official documentation](https://elysiajs.com).

_*Eden*_

A type-safeREST client that offers end-to-end typesafety.
Learn more about it from [the official documentation](https://elysiajs.com/eden/overview.html).

_*Tanstack-Query*_

A full featured asynchronous state management solution.
Learn more about it from [the offical documentation](https://tanstack.com/query/latest).

## 👷 Contributing

Please read the [contributing guidelines](CONTRIBUTING.md) before opening an issue or pull request
to begin developing. The guide will provide an overview of steps to initialize the local
development environment, as well as architecture of the project.

## ⭐Star History

<a href="https://star-history.com/#ap0nia/eden-query&Date">
 <picture>
   <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/svg?repos=ap0nia/eden-query&type=Date&theme=dark" />
   <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/svg?repos=ap0nia/eden-query&type=Date" />
   <img alt="Star History Chart" src="https://api.star-history.com/svg?repos=ap0nia/eden-query&type=Date" />
 </picture>
</a>

<h1 align="center">eden-query</h1>

> elysia.js-eden + tanstack-query integrations

<div align="center">

  <img alt="NPM Downloads" src="https://img.shields.io/npm/dw/%40ap0nia%2Feden-svelte-query">
  <img alt="NPM License" src="https://img.shields.io/npm/l/%40ap0nia%2Feden-svelte-query">
  <img alt="GitHub Actions Workflow Status" src="https://img.shields.io/github/actions/workflow/status/ap0nia/eden-query/release.yml">

  ![NPM Downloads](https://img.shields.io/npm/dm/%40ap0nia%2Feden-svelte-query)

</div>

## Get Started

### Installation

```sh
# npm
npm install @ap0nia/eden-react-query

# yarn
yarn add @ap0nia/eden-react-query

# pnpm
pnpm add @ap0nia/eden-react-query
```

### Usage

```tsx
import { eden } from '~/lib/eden'

export function Products() {
  const { data } = eden.api.products.get.useQuery()

  return (
    <ul>
      {data?.map(product => (
        <li>{product.name}</li>
      )}
    </ul>
  )
}
```

<details>
  <summary>Click me</summary>

  ```tsx
  import { eden } from '~/lib/eden'

  export function Products() {
    const { data } = eden.api.products.get.useQuery()

    return (
      <ul>
        {data?.map(product => (
          <li>{product.name}</li>
        )}
      </ul>
    )
  }
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

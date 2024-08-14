---
title: Quick Start - Elysia.js
head:
  - - meta
    - property: 'og:title'
      content: Quick Start - Elysia.js

  - - meta
    - name: 'description'
      content: >
        Elysia.js is a library built for Bun, which is the only prerequisite.
        To get started, run the "bun create elysia hi-elysia" command to create a new project,
        then run the "bun dev" command to start a development server.

  - - meta
    - property: 'og:description'
      content: >
        Elysia.js is a library built for Bun, which is the only prerequisite.
        To get started, run the "bun create elysia hi-elysia" command to create a new project,
        then run the "bun dev" command to start a development server.
---

# Quick Start

Elysia is optimized for Bun, which is a JavaScript runtime that aims to be a drop-in replacement for Node.js.

You can install Bun with the command below:

```bash
curl https://bun.sh/install | bash
```

:::info
Read more about Bun from [their official documentation](https://bun.sh/).
:::

## Automatic Installation

1. Create and bootstrap a new application in a directory named `app`.

```bash
bun create elysia app
```

2. Change your working directory to the new application.

```bash
cd app
```

3. Start the development server.

```bash
bun dev
```

4. Go to [localhost:3000](http://localhost:3000) and you should see a page that says "Hello Elysia".

## Manual Installation

1. Create a `package.json` and add the following scripts.

```json
{
  "scripts": {
    "dev": "bun --watch src/index.ts",
    "build": "bun build src/index.ts",
    "start": "NODE_ENV=production bun src/index.ts",
    "test": "bun test"
  }
}
```

These scripts refer to the different stages of developing an application:

- **dev** - Start Elysia in development mode with auto-reload on code change.
- **build** - Build the application for production usage.
- **start** - Start an Elysia production server.

2. Install packages.

```bash npm2yarn
npm install elysia
```

3. If you are using TypeScript, create a `tsconfig.json`, and set `strict` to `true`:

```json
{
  "compilerOptions": {
    "strict": true
  }
}
```

:::tip
This ensures that you are getting the full benefits of Elysia's robust type safety!
:::

4. Create the entrypoint for your Elysia server application.

::: code-group

```typescript [src/index.ts]
import { Elysia } from 'elysia'

new Elysia().get('/', () => 'Hello, Elysia').listen(3000)
```

:::

5. Start the development server by running the `dev` command.

```bash
bun dev
```

6. Go to [localhost:3000](http://localhost:3000) and you should see a page that says "Hello Elysia".

## Project Structure

Here is a simple project structure for getting started with development:

```md
📁 src - Source code for your Elysia server application.
│   ├── 🇹🇸 index.ts - Entry point for your application.
│   ├── 🇹🇸 setup.ts - Various plugins to be used as a Service Locator.
│   │── 📁 controllers - Elysia instances that encapsulate endpoints.
│   │── 📁 libs - Utilities.
│   │── 📁 models - Data Transfer Objects (DTOs) for your application.
│   └── 📁 types - Shared TypeScript types, if needed.
└── 📁 tests - Test for your Elysia server application.
```

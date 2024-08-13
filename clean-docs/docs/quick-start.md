---
title: Quick Start - ElysiaJS
head:
  - - meta
    - property: 'og:title'
      content: Quick Start - ElysiaJS

  - - meta
    - name: 'description'
      content: Elysia is a library built for Bun and the only prerequisite. To start, bootstrap a new project with "bun create elysia hi-elysia" and start the development server with "bun dev". This is all it needs to do a quick start or get started with ElysiaJS.

  - - meta
    - property: 'og:description'
      content: Elysia is a library built for Bun and the only prerequisite. To start, bootstrap a new project with "bun create elysia hi-elysia" and start the development server with "bun dev". This is all it needs to do a quick start or get started with ElysiaJS.
---

# Quick Start

Elysia is optimized for Bun which is a JavaScript runtime that aims to be a drop-in replacement for Node.js.

You can install Bun with the command below:

```bash
curl https://bun.sh/install | bash
```

:::info
Read more about Bun from [their official documentation](https://bun.sh/).
:::

## Automatic Installation

1. Run the command ,`bun create elysia`, to automatically setup a new application.

```bash
bun create elysia app
```

2. Once the command is done, you should see the folder `app` in your current directory.

```bash
cd app
```

3. Start the development server by running the `dev` command.

```bash
bun dev
```

4. Navigate to [localhost:3000](http://localhost:3000) and you should be greeted with "Hello Elysia".

::: tip
Elysia provides the `dev` command to automatically reload your server on file changes.
:::

## Manual Installation

1. To manually create a new Elysia app, install Elysia as a package:

```bash npm2yarn
npm install elysia
```

2. Open your `package.json` file and add the following scripts:

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

3. If you are using TypeScript, make sure to create a `tsconfig.json`, and set `compilerOptions.strict` to `true`:

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

4. Create the entrypoint source file for your Elysia server application at `src/index.ts`

```ts twoslash
import { Elysia } from 'elysia'

const app = new Elysia().get('/', () => 'Hello, Elysia')

app.listen(3000)
```

5. Start the development server by running the `dev` command.

```bash
bun dev
```

6. Navigate to [localhost:3000](http://localhost:3000) and you should be greeted with "Hello Elysia".

## Structure

Here is a simple project structure for starting out with Elysia development:

```
📁 src - Source code for your Elysia server application.
│   ├── 🇹‌🇸‌ index.ts - Entry point for your application.
│   ├── 🇹‌🇸‌ setup.ts - Various plugins to be used as a Service Locator.
│   │── 📁 controllers - Elysia instances that encapsulate endpoints.
│   │── 📁 libs - Utilities.
│   │── 📁 models - Data Transfer Objects (DTOs) for your application.
│   └── 📁 types - Shared TypeScript types, if needed.
└── 📁 tests - Test for your Elysia server application.
```

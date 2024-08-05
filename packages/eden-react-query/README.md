# @elysiajs/eden-react-query

> @elysiajs/eden + @tanstack/react-query integration

## Project Structure
 src
├──  index.ts -> entry point for library
├──  implementation -> the library's core
│   ├──  fetch -> eden-fetch API
│   │   ├──  context.ts -> context/utils API for eden-fetch
│   └── treaty -> eden-treaty API
└──  integration -> types and functions that connect eden and react-query
    ├──  use-query.ts
    ├──  use-mutation.ts
    └── ...
├──  query-key.ts
├──  request.ts
├──  treaty.tsx
├──  use-hook-result.ts
├──  use-infinite-query.ts
├──  use-mutation.ts
├──  use-queries.ts
├──  use-query.ts
├──  use-subscription.ts
├──  use-suspense-infinite-query.ts
├──  use-suspense-queries.ts
├──  use-suspense-query.ts
└──  utils
    ├──  is-async-iterable.ts
    ├──  is-object.ts
    ├──  is-store.ts
    └──  types.ts

```svelte twoslash
<script lang="ts" module>
// @paths: { "$lib/*": ["./src/lib/*"], "$server": ["./src/server"] }

// @filename: src/server/index.ts
export const app = {}

// @filename: src/lib/eden.ts
import { app } from '$server'

export const hello = "Hello, Eden"
export { app }

// @filename: src/routes/+page.ts
// ---cut---
</script>

<script lang="ts">
  import { app, hello } from '$lib/eden'

  console.log(hello)
</script>

<div>{hello}</div>
```

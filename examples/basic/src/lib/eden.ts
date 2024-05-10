import { createEdenTreatyQuery } from '@ap0nia/eden-svelte-query'

import type { App } from '$lib/server'

export const eden = createEdenTreatyQuery<App>()

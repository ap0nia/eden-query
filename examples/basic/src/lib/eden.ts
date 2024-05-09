import { createTreatyFetchQuery } from '@ap0nia/eden-svelte-query'

import type { App } from '$lib/server'

export const eden = createTreatyFetchQuery<App>()

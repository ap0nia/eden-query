import { createEdenTreatyReactQuery } from '@ap0nia/eden-react-query'

import type { App } from '@/server'

export const eden = createEdenTreatyReactQuery<App>()

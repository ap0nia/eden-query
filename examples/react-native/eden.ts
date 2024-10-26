import { createEdenTreatyReactQuery } from '@ap0nia/eden-react-query'

import type { App } from './app/api/[...slugs]+api'

export const eden = createEdenTreatyReactQuery<App>()

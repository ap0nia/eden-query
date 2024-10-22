import { createEdenTreatyReactQuery } from '@ap0nia/eden-react-query'

import type { App } from './app/[...slugs]+api'

export const eden = createEdenTreatyReactQuery<App>()

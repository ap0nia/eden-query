import { elysia } from './setup'

export const app = elysia.get('/', () => 'Hello, World!')

export type App = typeof app

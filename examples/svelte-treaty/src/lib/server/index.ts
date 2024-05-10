import { elysia } from './setup'

export const app = elysia.get('/', () => {
  return 'Hello, World!'
})

export type App = typeof app

import type { RequestEvent } from '@sveltejs/kit'
import { Elysia } from 'elysia'

export const elysia = new Elysia({ prefix: '/api' }).derive((context) => {
  // Make sure SvelteKit event is appended to request before app.handle is called,
  // then destructure it here.
  const { event, ...request } = context.request as any

  return {
    request: request as Request,
    event: event as RequestEvent,
  }
})

import { batchPlugin } from '@ap0nia/eden-svelte-query'
import type { RequestEvent } from '@sveltejs/kit'
import { Elysia } from 'elysia'

export const elysia = new Elysia({ prefix: '/api' })
  .derive((context) => {
    const { event } = context.request as any

    return {
      request: context.request,
      event: event as RequestEvent,
    }
  })
  .use(batchPlugin())

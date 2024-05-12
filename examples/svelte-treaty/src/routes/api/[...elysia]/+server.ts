import { Elysia } from 'elysia'

import { app } from '$lib/server'

import type { RequestHandler } from './$types'

/**
 * A new {@link Elysia} instance needs to be initialized here so it can be reloaded by HMR properly.
 *
 * The {@link app} instance does not seem to update after a hot-reload.
 */
const instance = new Elysia().use(app)

const handle: RequestHandler = async (event) => {
  const request: any = event.request
  request.event = event
  return await instance.handle(event.request)
}

export const GET = handle
export const POST = handle
export const PATCH = handle
export const PUT = handle
export const DELETE = handle
export const HEAD = handle

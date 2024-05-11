import { app } from '$lib/server'

import type { RequestHandler } from './$types'

const handle: RequestHandler = async (event) => {
  const request: any = event.request
  request.event = event
  return await app.handle(event.request)
}

export const GET = handle
export const POST = handle
export const PATCH = handle
export const PUT = handle
export const DELETE = handle
export const HEAD = handle

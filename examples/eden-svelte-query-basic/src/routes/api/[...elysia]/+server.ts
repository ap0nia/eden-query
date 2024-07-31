import { app } from '../../../server'
import type { RequestHandler } from './$types'

const handler: RequestHandler = async (event) => {
  return await app.handle(event.request)
}

export const GET = handler
export const POST = handler
export const PUT = handler
export const PATCH = handler
export const DELETE = handler
export const OPTIONS = handler
export const HEAD = handler

import type { RequestHandler } from './$types'

export const GET: RequestHandler = async (event) => {
  event.locals.test = true
  console.log('here')
  return new Response('hi')
}

import type { LayoutServerLoad } from './$types'

export const load: LayoutServerLoad = async (event) => {
  return { dehydrated: event.locals.dehydrated }
}

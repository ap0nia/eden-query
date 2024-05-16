import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async (event) => {
  await event.locals.eden.api.index.get.ensureData({})
}

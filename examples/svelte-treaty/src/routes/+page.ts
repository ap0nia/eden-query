import type { PageLoad } from './$types'

/**
 * Enable general purpose load functions can write directly to the QueryClient
 * that will be used on the page.
 */
export const load: PageLoad = async (_event) => {
  // const { eden } = await event.parent()
  // await eden.api.index.get.fetch({})
}

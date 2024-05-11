import type { PageLoad } from './$types'

export const load: PageLoad = async (event) => {
  const { eden } = await event.parent()

  const utils = eden.context

  await utils.api.index.get.fetch({})
}

import type { PageLoad } from './$types'

export const load: PageLoad = async (event) => {
  const { eden } = await event.parent()

  const utils = eden.context

  const result = await utils.api.index.get.fetch({})

  console.log({ result })
}

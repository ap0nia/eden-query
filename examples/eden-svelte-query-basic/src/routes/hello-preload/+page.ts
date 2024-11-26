import type { PageLoad } from './$types'

export const load: PageLoad = async (event) => {
  const { eden } = await event.parent()

  const result = await eden.api.index.get.fetch({})

  console.log('load result:', result)
}

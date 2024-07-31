import { eden } from '$lib/eden'

import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async (event) => {
  const utils = eden.createContext(undefined, {
    dehydrated: event.locals.dehydrated,
    fetcher: event.fetch,
  })

  const result = await utils.api.index.get.fetch({})

  console.log('SSR result: ', result)
}

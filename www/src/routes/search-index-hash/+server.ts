import { json } from '@sveltejs/kit'

import { searchIndexHash } from '$lib/virtual-search-index-hash'

export const prerender = true

export const GET = async (_event) => {
  return json(searchIndexHash)
}

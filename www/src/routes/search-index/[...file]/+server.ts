import { json } from '@sveltejs/kit'

import { pages, searchIndex } from '$lib/virtual-search-index-hash'

import type { EntryGenerator } from './$types'

export const prerender = true

export const entries: EntryGenerator = async () => {
  return Object.keys(pages).map((file) => {
    return { file }
  })
}

export const GET = async (event) => {
  return json(searchIndex[event.params.file])
}

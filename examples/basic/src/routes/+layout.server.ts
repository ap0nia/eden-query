import type { LayoutServerLoad } from './$types'

export const load: LayoutServerLoad = async (event) => {
  console.log('locals: ', event.locals)
  return {
    ...event.locals,
  }
}

// import type { LayoutServerLoad } from './$types'
//
// export const load: LayoutServerLoad = async (event) => {
//   return {
//     /**
//      * Root cache.
//      * +layout.server.ts runs before +page.server.ts, so this will be outdated if a page
//      * runs SSR queries.
//      *
//      * Append to the SSR cache by running `mergeDehydrated` in the +page.server.ts
//      */
//     dehydrated: event.locals.dehydrated,
//   }
// }

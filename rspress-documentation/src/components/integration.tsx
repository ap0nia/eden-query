/**
 * Two connected cards with Elysia.js and Tanstack Query, representing
 * the integration between the two libraries.
 */
export function Integration() {
  return (
    <div className="grid sm:grid-cols-2 gap-2">
      <a
        href="https://elysiajs.com"
        target="_blank"
        className="p-8 flex justify-between items-center border rounded-lg group"
      >
        <p className="text-xl font-bold group-hover:underline">Elysia.js</p>
        <img
          src="/assets/elysia_v.webp"
          alt="Curved text logo saying 'Elysia JS'"
          className="h-20 object-contain"
        />
      </a>
      <a
        href="https://tanstack.com/query/latest"
        target="_blank"
        className="p-8 flex justify-between items-center border rounded-lg group"
      >
        <p className="text-xl font-bold group-hover:underline">Tanstack Query</p>
        <img
          src="/images/react-query-logo.svg"
          alt="React Query logo"
          className="h-20 object-contain"
        />
      </a>
    </div>
  )
}

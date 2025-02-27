/**
 * Two connected cards with Elysia.js and Tanstack Query, representing
 * the integration between the two libraries.
 */
export function Integration() {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      <a
        href="https://elysiajs.com"
        target="_blank"
        className="hover:bg-base-200 flex items-center justify-between rounded-lg border p-8 transition-transform hover:-translate-y-1"
      >
        <p className="text-xl font-bold">Elysia.js</p>
        <img
          src="/assets/elysia_v.webp"
          alt="Curved text logo saying 'Elysia JS'"
          className="h-20 object-contain"
        />
      </a>

      <a
        href="https://tanstack.com/query/latest"
        target="_blank"
        className="hover:bg-base-200 flex items-center justify-between rounded-lg border p-8 transition-transform hover:-translate-y-1"
      >
        <p className="text-xl font-bold">Tanstack Query</p>
        <img
          src="/images/react-query-logo.svg"
          alt="React Query logo"
          className="h-20 object-contain"
        />
      </a>
    </div>
  )
}

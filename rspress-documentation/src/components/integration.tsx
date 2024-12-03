/**
 * Two connected cards with Elysia.js and Tanstack Query, representing
 * the integration between the two libraries.
 */
export function Integration() {
  return (
    <div className="grid grid-cols-2 gap-2">
      <div className="p-8 border rounded-lg">
        <p>Elysia.js</p>
        <img
          src="/assets/elysia_v.webp"
          alt="Curved text logo saying 'Elysia JS'"
          className="max-w-[40ch] w-full object-contain object-left md:object-center mr-auto md:mr-0"
          style={{ aspectRatio: '1.5 / 1' }}
        />
      </div>
      <div className="p-8 border rounded-lg">Tanstack Query</div>
    </div>
  )
}

import E2E from '@/docs/snippets/e2e.mdx'

export function Integrations() {
  return (
    <article className="integrations mx-auto grid w-full max-w-5xl justify-center gap-4 p-4 lg:grid-cols-2">
      <section className="relative flex flex-col gap-1 p-2">
        <div className="pointer absolute" style={{ width: '1.5px', height: '100%', top: '0%' }}>
          <p className="absolute top-14 pl-2 font-mono text-sm font-semibold text-sky-500"></p>
        </div>

        <p className="pointer-events-none absolute right-2 top-2 z-10 rounded-full border bg-gray-50/40 px-2 py-1 text-xs backdrop-blur-sm dark:border-gray-600 dark:bg-gray-700/40">
          POST /character/:id/chat
        </p>

        <p className="pointer-events-none absolute bottom-2 left-2 z-10 rounded-full bg-blue-500 px-2 py-1 text-xs font-semibold text-white backdrop-blur-sm">
          Playback
        </p>

        <div
          style={{ width: '4rem' }}
          className="relative h-3.5 rounded-full bg-teal-400 text-teal-400"
        >
          <span className="absolute bottom-0 left-[110%] text-xs font-semibold">Request</span>
        </div>

        <div
          style={{ width: '4rem', marginLeft: '4rem' }}
          className="relative h-3.5 rounded-full bg-teal-400 text-teal-400"
        >
          <span className="absolute bottom-0 left-[110%] text-xs font-semibold">Validation</span>
        </div>

        <div
          style={{ width: '2rem', marginLeft: '6rem' }}
          className="relative h-3.5 rounded-full bg-teal-400"
        />

        <div
          style={{ width: '2rem', marginLeft: '8rem' }}
          className="relative h-3.5 rounded-full bg-cyan-400"
        />

        <div
          style={{ width: '5rem', marginLeft: '10rem' }}
          className="relative h-3.5 rounded-full bg-sky-400 text-sky-400"
        >
          <span className="absolute bottom-0 left-[110%] text-xs font-semibold">Transaction</span>
        </div>

        <div
          style={{ width: '3rem', marginLeft: '12rem' }}
          className="relative h-3.5 rounded-full bg-sky-400"
        />

        <div
          style={{ width: '5rem', marginLeft: '15rem' }}
          className="relative h-3.5 rounded-full bg-blue-400 text-blue-400"
        >
          <span className="absolute bottom-0 left-[110%] text-xs font-semibold">Upload</span>
        </div>

        <div
          style={{ width: '3rem', marginLeft: '17rem' }}
          className="relative h-3.5 rounded-full bg-blue-400"
        />

        <div
          style={{ width: '4rem', marginLeft: '20rem' }}
          className="relative h-3.5 rounded-full bg-indigo-400 text-indigo-400"
        >
          <span className="absolute bottom-0 left-[110%] text-xs font-semibold">Sync</span>
        </div>

        <div
          style={{ width: '4rem', marginLeft: '24rem' }}
          className="relative h-3.5 rounded-full bg-indigo-400"
        />

        <div
          style={{ width: '2rem', marginLeft: '26rem' }}
          className="relative h-3.5 rounded-full bg-indigo-400"
        />

        <div
          style={{ width: '1rem', marginLeft: '27rem' }}
          className="relative h-3.5 rounded-full bg-purple-400"
        />
      </section>

      <section>
        <E2E />
      </section>

      <header>
        <h5>
          <span className="icon-[mdi--heart-outline] text-2xl"></span>
          <span>For DevOps</span>
        </h5>

        <h2 className="text-gradient from-sky-400 to-violet-400">OpenTelemetry</h2>

        <p>
          Elysia has 1st party support for OpenTelemetry. Instrumentation is built-in, so you can
          easily monitor your services on regardless of the platform.
        </p>
      </header>

      <header>
        <h5>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            className="scale-90 transform"
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
          For Frontend
        </h5>

        <h2 className="text-gradient from-purple-400 to-rose-400">End-to-end Type Safety</h2>

        <p>
          Like tRPC, Elysia provides type-safety from the backend to the frontend without code
          generation. The interaction between frontend and backend is type-checked at compile time.
        </p>
      </header>
    </article>
  )
}

export function Hero() {
  return (
    <>
      <link rel="preload" as="image" href="/assets/elysia_v.webp" />
      <div
        id="splash"
        className="pointer-events-none absolute top-[-70vh] max-w-full justify-center w-full h-screen opacity-25 block gradient"
      ></div>
      <header
        className="relative flex flex-col justify-center items-center w-full px-6 pt-6 md:pt-0 mb-16 md:mb-8 overflow-hidden"
        style={{ minHeight: 'calc(100vh - 64px)' }}
      >
        <img
          src="/assets/elysia_v.webp"
          alt="Curved text logo saying 'Elysia JS'"
          className="max-w-[40ch] w-full object-contain object-left md:object-center mr-auto md:mr-0"
          style={{ aspectRatio: '1.5 / 1' }}
        />
        <h2 className="relative text-5xl md:text-6xl md:leading-tight font-bold md:text-center leading-tight text-transparent bg-clip-text bg-gradient-to-r from-sky-300 to-violet-400 mb-6">
          Ergonomic Framework for Humans
          <span className="absolute w-10 md:w-12 h-10 md:h-12 bottom-0 mb-4 ml-2 md:ml-0 md:mb-10 text-indigo-400">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256">
              <rect width="256" height="256" fill="none" />
              <path
                d="M138.7,175.5l-19.2,52.1a8,8,0,0,1-15,0L85.3,175.5a8.1,8.1,0,0,0-4.8-4.8L28.4,151.5a8,8,0,0,1,0-15l52.1-19.2a8.1,8.1,0,0,0,4.8-4.8l19.2-52.1a8,8,0,0,1,15,0l19.2,52.1a8.1,8.1,0,0,0,4.8,4.8l52.1,19.2a8,8,0,0,1,0,15l-52.1,19.2A8.1,8.1,0,0,0,138.7,175.5Z"
                fill="currentcolor"
                stroke="currentcolor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="0"
              />
              <line
                x1="176"
                y1="16"
                x2="176"
                y2="64"
                fill="none"
                stroke="currentcolor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="16"
              />
              <line
                x1="200"
                y1="40"
                x2="152"
                y2="40"
                fill="none"
                stroke="currentcolor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="16"
              />
              <line
                x1="224"
                y1="72"
                x2="224"
                y2="104"
                fill="none"
                stroke="currentcolor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="16"
              />
              <line
                x1="240"
                y1="88"
                x2="208"
                y2="88"
                fill="none"
                stroke="currentcolor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="16"
              />
            </svg>
          </span>
        </h2>
        <h3 className="text-xl md:text-2xl text-gray-500 dark:text-gray-400 !leading-normal text-left md:text-center w-full max-w-2xl">
          TypeScript with
          <span className="text-transparent font-semibold bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
            End-to-End Type Safety
          </span>
          , type integrity, and exceptional developer experience. Supercharged by Bun.
        </h3>
        <section className="flex flex-col sm:flex-row items-start sm:items-center w-full md:w-auto gap-4 mt-10 mb-12">
          <a
            className="text-white font-semibold text-lg bg-pink-400 dark:bg-pink-500 px-6 py-2.5 rounded-full"
            id="hero-get-started"
            href="/eden-query/index"
          >
            Get Started
          </a>
          <div className="relative flex flex-1 gap-3 text-pink-500">
            <code className="text-pink-500 font-mono font-medium text-lg bg-pink-200/25 dark:bg-pink-500/20 px-6 py-2.5 rounded-full">
              bun create elysia app
            </code>
            <button
              id="hero-copy"
              className="hidden sm:inline-flex p-3 rounded-2xl active:rounded-full hover:bg-pink-200/25 focus:bg-pink-200/25 active:bg-pink-200/50 hover:dark:bg-pink-500/20 focus:dark:bg-pink-500/20 active:dark:bg-pink-500/20 transition-all"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="feather feather-copy"
              >
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
            </button>
            <p v-if="copied" className="absolute -bottom-8 right-0">
              Copied
            </p>
          </div>
        </section>
        <p className="flex justify-center items-center gap-2 text-gray-400">
          See why developers love Elysia
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-6 h-6 motion-safe:animate-bounce"
          >
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <polyline points="19 12 12 19 5 12"></polyline>
          </svg>
        </p>
      </header>
    </>
  )
}

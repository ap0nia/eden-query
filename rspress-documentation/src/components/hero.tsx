import { Search, SwitchAppearance, useThemeState } from 'rspress/theme'

function Ray() {
  return (
    <div className="absolute flex flex-col z-[40] w-full !max-w-full items-center justify-center bg-transparent transition-bg overflow-hidden h-[220px] top-0 left-0 opacity-25 dark:opacity-[.55] pointer-events-none">
      <div
        className="jumbo static absolute opacity-60"
        // :class="{
        //     // '-safari': isSafari,
        //     '-animate': animated,
        //     '-static': isStatic
        // }"
      />
    </div>
  )
}

export function Hero() {
  const [theme, setTheme] = useThemeState()

  const copied = false

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  return (
    <>
      <link rel="preload" as="image" href="/assets/elysia_v.webp" />

      <div data-theme={theme} className="w-full min-h-dvh p-4 flex flex-col justify-center gap-16">
        <Ray />

        <div className="w-full h-[var(--rp-nav-height)] px-6 flex items-center justify-between">
          <div>
            <Search />
          </div>

          <div className="flex gap-4">
            <div>
              <SwitchAppearance />
            </div>

            <div>
              <button
                onClick={toggleTheme}
                className={`p-1 border border-solid border-gray-300 text-gray-400  cursor-pointer rounded-md hover:border-gray-600 hover:text-gray-600 dark:hover:border-gray-200 dark:hover:text-gray-200 transition-all duration-300 w-7 h-7 swap swap-rotate ${theme === 'dark' && 'swap-active'}`}
              >
                <svg
                  className="swap-on h-full w-full fill-current"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                >
                  <path d="M5.64,17l-.71.71a1,1,0,0,0,0,1.41,1,1,0,0,0,1.41,0l.71-.71A1,1,0,0,0,5.64,17ZM5,12a1,1,0,0,0-1-1H3a1,1,0,0,0,0,2H4A1,1,0,0,0,5,12Zm7-7a1,1,0,0,0,1-1V3a1,1,0,0,0-2,0V4A1,1,0,0,0,12,5ZM5.64,7.05a1,1,0,0,0,.7.29,1,1,0,0,0,.71-.29,1,1,0,0,0,0-1.41l-.71-.71A1,1,0,0,0,4.93,6.34Zm12,.29a1,1,0,0,0,.7-.29l.71-.71a1,1,0,1,0-1.41-1.41L17,5.64a1,1,0,0,0,0,1.41A1,1,0,0,0,17.66,7.34ZM21,11H20a1,1,0,0,0,0,2h1a1,1,0,0,0,0-2Zm-9,8a1,1,0,0,0-1,1v1a1,1,0,0,0,2,0V20A1,1,0,0,0,12,19ZM18.36,17A1,1,0,0,0,17,18.36l.71.71a1,1,0,0,0,1.41,0,1,1,0,0,0,0-1.41ZM12,6.5A5.5,5.5,0,1,0,17.5,12,5.51,5.51,0,0,0,12,6.5Zm0,9A3.5,3.5,0,1,1,15.5,12,3.5,3.5,0,0,1,12,15.5Z" />
                </svg>

                <svg
                  className="swap-off h-full w-full fill-current"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                >
                  <path d="M21.64,13a1,1,0,0,0-1.05-.14,8.05,8.05,0,0,1-3.37.73A8.15,8.15,0,0,1,9.08,5.49a8.59,8.59,0,0,1,.25-2A1,1,0,0,0,8,2.36,10.14,10.14,0,1,0,22,14.05,1,1,0,0,0,21.64,13Zm-9.5,6.69A8.14,8.14,0,0,1,7.08,5.22v.27A10.15,10.15,0,0,0,17.22,15.63a9.79,9.79,0,0,0,2.1-.22A8.11,8.11,0,0,1,12.14,19.73Z" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <div className="w-full grow-1 flex flex-col items-center justify-center gap-8">
          <div
            id="splash"
            className="pointer-events-none absolute top-[-70vh] max-w-full justify-center w-full h-screen opacity-25 block gradient"
          ></div>

          <img
            src="/assets/elysia_v.webp"
            alt="Curved text logo saying 'Elysia JS'"
            className="max-w-[40ch]! w-full object-contain aspect-3/2"
          />

          <h2 className="relative">
            <span className="font-bold leading-tight text-5xl md:text-6xl md:leading-tight md:text-center text-transparent bg-clip-text bg-gradient-to-r from-sky-300 to-violet-400">
              Ergonomic Framework for Humans
            </span>

            <span className="absolute w-10 md:w-12 h-10 md:h-12 bottom-0 ml-2 md:ml-0 text-indigo-400">
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

          <h3 className="w-full max-w-2xl text-xl md:text-2xl text-gray-500 dark:text-gray-400 !leading-normal md:text-center">
            <span>TypeScript with &nbsp;</span>

            <span className="text-transparent font-semibold bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
              End-to-End Type Safety
            </span>

            <span>
              , type integrity, and exceptional developer experience. Supercharged by Bun.
            </span>
          </h3>

          <section className="flex items-center md:justify-center gap-4 flex-wrap">
            <a
              className="text-white font-semibold text-lg bg-pink-400 dark:bg-pink-500 px-6 py-2.5 rounded-full"
              id="hero-get-started"
              href="/eden-query/index"
            >
              Get Started
            </a>

            <div className="relative flex gap-4 text-pink-500">
              <code className=" px-6 py-2.5 font-mono font-medium text-pink-500 text-lg bg-pink-200/25 dark:bg-pink-500/20 rounded-full whitespace-nowrap">
                bun create elysia app
              </code>

              <button className="inline-flex p-3 rounded-2xl active:rounded-full hover:bg-pink-200/25 focus:bg-pink-200/25 active:bg-pink-200/50 hover:dark:bg-pink-500/20 focus:dark:bg-pink-500/20 active:dark:bg-pink-500/20 transition-all">
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

              {copied && <p className="absolute -bottom-8 right-0">Copied</p>}
            </div>
          </section>
        </div>

        <p className="flex justify-center items-center gap-2 text-gray-400">
          <span>See why developers love Elysia</span>

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
      </div>
    </>
  )
}

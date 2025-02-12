import { useRef, useState } from 'react'

import { Ray } from '../components/ray'
import { cn } from '../utils/cn'

export function Hero() {
  const [copied, setCopied] = useState(false)

  const copyValue = 'bun create elysia app'

  const copyRef = useRef<ReturnType<typeof setTimeout>>()

  const handleCopy = () => {
    if (typeof navigator == 'undefined') return

    navigator.clipboard.writeText(copyValue)

    setCopied(true)

    clearTimeout(copyRef.current)

    copyRef.current = setTimeout(resetCopied, 1000)
  }

  const resetCopied = () => {
    setCopied(false)
  }

  return (
    <div
      className="w-full flex flex-col gap-16"
      style={{ minHeight: 'calc(100dvh - var(--rp-nav-height))' }}
    >
      <Ray className="h-[60vh] -top-16 pointer-events-none opacity-[.35] dark:opacity-50" />

      <div className="w-full p-4 grow flex flex-col items-center justify-center gap-8">
        <div
          id="splash"
          className="pointer-events-none absolute top-[-70vh] max-w-full justify-center w-full h-screen opacity-25 block gradient"
        ></div>

        <img
          src="/assets/elysia_v.webp"
          alt="Curved text logo saying 'Elysia JS'"
          className="w-full max-w-md object-contain aspect-3/2"
        />

        <p>
          <span className="font-bold leading-tight text-5xl md:text-6xl md:text-center text-transparent bg-clip-text bg-gradient-to-r from-sky-300 to-violet-400">
            Ergonomic Framework for Humans
          </span>

          <span className="w-10 h-10 text-indigo-400 align-top icon-[ph--sparkle-fill]"></span>
        </p>

        <h3 className="w-full max-w-2xl md:text-center text-xl md:text-2xl text-gray-500 dark:text-gray-400 !leading-normal">
          <span>TypeScript with &nbsp;</span>

          <span className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
            End-to-End Type Safety
          </span>

          <span>, type integrity, and exceptional developer experience. Supercharged by Bun.</span>
        </h3>

        <section className="flex items-center md:justify-center gap-4 flex-wrap">
          <a className="btn btn-primary px-6 text-lg rounded-full" href="/eden-query/index">
            Get Started
          </a>

          <div className="flex gap-4">
            <code className="px-6 py-2.5 font-mono font-medium text-lg bg-primary/25 rounded-full whitespace-nowrap">
              {copyValue}
            </code>

            <div
              className={cn('tooltip-bottom tooltip-primary', copied && 'tooltip tooltip-open')}
              data-tip="Copied"
            >
              <button
                className={cn('swap btn btn-primary btn-outline', copied && 'swap-active')}
                onClick={handleCopy}
              >
                <span className="swap-on icon-[material-symbols--check-rounded] w-6 h-6"></span>
                <span className="swap-off icon-[material-symbols--content-copy-outline-rounded] w-6 h-6"></span>
              </button>
            </div>
          </div>
        </section>
      </div>

      <p className="p-4 text-center text-gray-400">
        <span>See why developers love Elysia&nbsp;&nbsp;</span>
        <span className="w-6 h-6 motion-safe:animate-bounce icon-[material-symbols--arrow-downward-rounded] align-bottom"></span>
      </p>
    </div>
  )
}

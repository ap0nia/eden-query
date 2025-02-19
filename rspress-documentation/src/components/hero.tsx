import { useRef, useState } from 'react'

import { Ray } from '@/components/ray'
import { Tree, TreeItem } from '@/components/ui/tree'
import { cn } from '@/utils/cn'

export type HeroProps = {
  children?: React.ReactNode
}

export function Hero(props: HeroProps) {
  const { children } = props

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
      className="flex w-full flex-col gap-12"
      style={{ minHeight: 'calc(100dvh - var(--rp-nav-height))' }}
    >
      <Ray className="pointer-events-none -top-16 h-[60vh] opacity-[.35] dark:opacity-50" />

      <div className="flex w-full grow flex-col items-center justify-center gap-8 p-4">
        <div
          id="splash"
          className="gradient pointer-events-none absolute top-[-70vh] block h-screen w-full max-w-full justify-center opacity-25"
        ></div>

        <Tree>
          <TreeItem value="ITEM 1" />
          <TreeItem value="ITEM 2" />
        </Tree>

        <img
          src="/assets/elysia_v.webp"
          alt="Curved text logo saying 'Elysia JS'"
          className="aspect-3/2 w-full max-w-md object-contain"
        />

        <p>
          <span className="bg-gradient-to-r from-sky-300 to-violet-400 bg-clip-text text-5xl font-bold leading-tight text-transparent md:text-center md:text-6xl">
            Ergonomic Framework for Humans
          </span>

          <span className="icon-[ph--sparkle-fill] h-10 w-10 align-top text-indigo-400"></span>
        </p>

        <h3 className="w-full max-w-2xl text-xl !leading-normal text-gray-500 md:text-center md:text-2xl dark:text-gray-400">
          <span>TypeScript with &nbsp;</span>

          <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text font-semibold text-transparent">
            End-to-End Type Safety
          </span>

          <span>, type integrity, and exceptional developer experience. Supercharged by Bun.</span>
        </h3>

        <section className="flex flex-wrap items-center gap-4 md:justify-center">
          <a className="btn btn-primary rounded-full px-6 text-lg" href="/eden-query/index">
            Get Started
          </a>

          <div className="flex gap-4">
            <code className="bg-primary/25 whitespace-nowrap rounded-full px-6 py-2.5 font-mono text-lg font-medium">
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
                <span className="swap-on icon-[material-symbols--check-rounded] h-6 w-6"></span>
                <span className="swap-off icon-[material-symbols--content-copy-outline-rounded] h-6 w-6"></span>
              </button>
            </div>
          </div>
        </section>
      </div>

      {children}
    </div>
  )
}

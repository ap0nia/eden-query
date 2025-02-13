import { motion } from 'motion/react'
import { useState } from 'react'

import { cn } from '@/utils/cn'

import Input from '../../docs/snippets/type-safety/input.mdx'
import Macros from '../../docs/snippets/type-safety/macros.mdx'
import Output from '../../docs/snippets/type-safety/output.mdx'

const tabs = [
  { id: 'input', label: 'Input', content: Input },
  { id: 'output', label: 'Output', content: Output },
  { id: 'macros', label: 'Macros', content: Macros },
]

export function TypeIntegrity() {
  const [active, setActive] = useState(tabs[0])

  return (
    <article className="mx-auto w-full max-w-5xl space-y-12 p-4">
      <div className="relative z-10 mb-7 flex w-full items-end justify-between">
        <h1 className="flex flex-1 flex-col text-3xl font-medium leading-[3rem] text-gray-600 sm:text-center sm:text-4xl sm:leading-[4rem] dark:text-gray-400">
          <span>The next level of&nbsp;</span>

          <span className="-translate-y-1 bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-6xl font-semibold leading-[5rem] text-transparent sm:text-7xl sm:leading-[5.5rem]">
            Type Safety
          </span>
        </h1>
      </div>

      <div>
        <section className="flex h-[38rem] items-center justify-center rounded-lg bg-[url(/public/assets/sequoia.webp)] bg-center p-4">
          <div className="showcase mockup-code w-full !max-w-3xl border">
            {active?.content && <active.content />}
          </div>
        </section>

        <section className="flex -translate-y-4 justify-center">
          <div role="tablist" className="showcase tabs tabs-boxed rounded-full">
            {tabs.map((tab) => {
              const isActive = active?.id === tab.id
              return (
                <button
                  key={tab.id}
                  role="tab"
                  className={cn('tab')}
                  onClick={setActive.bind(null, tab)}
                >
                  <span className="z-10">{tab.label}</span>

                  {isActive && (
                    <motion.span
                      layoutId="bubble"
                      className="bg-#9ca3af33 absolute inset-0 rounded-full dark:bg-[#ffffff26]"
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </button>
              )
            })}
          </div>
        </section>
      </div>
    </article>
  )
}

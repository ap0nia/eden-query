import type { Variants } from 'motion/react'
import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'

import Input from '@/docs/snippets/type-safety/input.mdx'
import Macros from '@/docs/snippets/type-safety/macros.mdx'
import Output from '@/docs/snippets/type-safety/output.mdx'
import { cn } from '@/utils/cn'

const tabs = [
  { id: 'input', label: 'Input', content: Input },
  { id: 'output', label: 'Output', content: Output },
  { id: 'macros', label: 'Macros', content: Macros },
]

const variants: Variants = {
  enter: (direction: number) => ({
    x: direction * 100,
    opacity: 0,
  }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({
    x: direction * -100,
    opacity: 0,
  }),
}

export function TypeIntegrity() {
  const [active, setActive] = useState(tabs[0])
  const [direction, setDirection] = useState(1)

  const handleTabChange = (newTab: (typeof tabs)[number]) => {
    const newIndex = tabs.findIndex((tab) => tab === newTab)
    const oldIndex = tabs.findIndex((tab) => tab === active)

    setDirection(newIndex > oldIndex ? 1 : -1)
    setActive(newTab)
  }

  return (
    <article className="mx-auto w-full max-w-5xl space-y-4 p-4">
      <h1 className="flex flex-col justify-center text-2xl font-medium text-gray-500 md:flex-row md:items-center md:gap-4 dark:text-gray-400">
        <p>The next level of</p>

        <p className="bg-gradient-to-r from-cyan-400 to-indigo-500 bg-clip-text text-7xl font-semibold leading-[6rem] text-transparent">
          type-safety
        </p>
      </h1>

      <div>
        <section className="flex h-[38rem] items-center justify-center rounded-lg bg-[url(/public/assets/sequoia.webp)] bg-center p-4">
          <AnimatePresence custom={direction} mode="wait">
            {active?.content && (
              <motion.div
                key={active.id}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.2, ease: 'easeInOut' }}
                custom={direction}
                className="showcase mockup-code w-full !max-w-3xl border"
              >
                <active.content />
              </motion.div>
            )}
          </AnimatePresence>
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
                  onClick={handleTabChange.bind(null, tab)}
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

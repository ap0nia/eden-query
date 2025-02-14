import { useInView } from 'motion/react'
import { useRef } from 'react'

import { cn } from '@/utils/cn'

export function Note() {
  const ref = useRef<HTMLDivElement>(null)

  const inView = useInView(ref, { once: true })

  return (
    <div ref={ref} className="mx-auto flex w-full max-w-xl flex-col gap-6">
      <div
        className={cn(
          inView && 'animate-in',
          'zoom-in fade-in duration-1000',
          'flex items-center gap-2 text-gray-300 dark:text-gray-500',
        )}
      >
        <div className="flex h-[1px] w-full grow bg-gray-300 dark:bg-gray-500" />
        <span className="icon-[mdi--heart-outline] h-8 w-8 shrink-0"></span>
        <div className="flex h-[1px] w-full grow bg-gray-300 dark:bg-gray-500" />
      </div>

      <h2
        className={cn(
          inView ? 'animate-in opacity-80' : 'opacity-0',
          'fade-in slide-in-from-top-4 delay-300 duration-1000',
          'text-center leading-normal',
        )}
      >
        <span>The first production ready,</span>
        <br className="sm:none block" />
        <span>and most loved Bun framework</span>
      </h2>
    </div>
  )
}

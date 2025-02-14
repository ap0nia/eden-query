import { useInView } from 'motion/react'
import { useRef } from 'react'

import Swagger from '@/docs/snippets/swagger.mdx'
import { cn } from '@/utils/cn'

export function Documentation() {
  const ref = useRef(null)

  const swaggerRef = useRef(null)

  const inView = useInView(ref, { once: true })

  const swaggerInView = useInView(swaggerRef, { once: true })

  return (
    <article className="mx-auto w-full max-w-5xl space-y-12 p-4">
      <header className="flex w-full flex-col justify-between gap-8 md:flex-row md:items-end">
        <h2 className="space-y-2 text-2xl font-medium text-gray-500 dark:text-gray-400">
          <p>Your own documentation</p>

          <p
            className={cn(
              inView ? 'animate-in' : 'animate-out',
              'fade-out fade-in slide-in-from-left-10 fill-mode-both duration-1000',
              'bg-gradient-to-r from-violet-400 to-blue-500 bg-clip-text text-7xl font-semibold text-transparent',
            )}
          >
            in 1 line
          </p>
        </h2>

        <div className="max-w-md space-y-4 md:pr-4 md:text-base dark:font-medium">
          <p>It's not magic...</p>

          <p>
            With built-in integration with OpenAPI schema, Elysia can generate Swagger documentation
            for your API out of the box.
          </p>
        </div>
      </header>

      <div ref={ref} className="flex flex-col gap-2 space-y-4">
        <div
          className={cn(
            'showcase mx-auto w-full overflow-x-auto rounded-xl',
            swaggerInView ? 'animate-in' : 'animate-out',
            'fade-out fade-in slide-in-from-top-10 fill-mode-both duration-1000 ease-in-out',
          )}
        >
          <Swagger />
        </div>

        <div className="flex items-center justify-center">
          <div
            className={cn(
              swaggerInView ? 'animate-in' : 'animate-out',
              'fade-out fade-in slide-in-from-top-10 fill-mode-both delay-200 duration-1000 ease-in-out',
            )}
          >
            <span className="icon-[mdi--chevron-triple-down] size-12"></span>
          </div>
        </div>

        <div
          ref={swaggerRef}
          className={cn(
            swaggerInView ? 'animate-in' : 'animate-out',
            'fade-out fade-in slide-in-from-top-10 fill-mode-both delay-300 duration-1000 ease-in-out',
          )}
        >
          <img
            src="/assets/scalar-preview-dark.webp"
            alt="Scalar documentation generated by Elysia using Elysia Swagger plugin"
            className="rounded-xl border shadow-xl"
            style={{ content: 'var(--swagger-preview-src)' }}
          />
        </div>
      </div>
    </article>
  )
}

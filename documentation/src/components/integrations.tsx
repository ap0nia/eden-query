import type { Rgb } from 'culori'
import { formatRgb, interpolate } from 'culori'
import { motion, useInView } from 'motion/react'
import { useRef, useState } from 'react'

import E2E from '@/snippets/e2e.mdx'
import { cn } from '@/utils/cn'

function formatRgb255(color: Rgb) {
  return formatRgb({ ...color, r: color.r / 255, g: color.g / 255, b: color.b / 255 })
}

const segments = [
  {
    start: 0,
    end: 0.1,
    label: 'Request',
  },
  {
    start: 0.1,
    end: 0.2,
    label: 'Validation',
  },
  {
    start: 0.15,
    end: 0.2,
  },
  {
    start: 0.2,
    end: 0.25,
  },
  {
    start: 0.25,
    end: 0.5,
    label: 'Transaction',
  },
  {
    start: 0.35,
    end: 0.5,
  },
  {
    start: 0.5,
    end: 0.7,
    label: 'Upload',
  },
  {
    start: 0.6,
    end: 0.7,
  },
  {
    start: 0.7,
    end: 0.85,
    label: 'Sync',
  },
  {
    start: 0.85,
    end: 1,
  },
  {
    start: 0.9,
    end: 1,
  },
  {
    start: 0.95,
    end: 1,
  },
]

const totalTime = 25

const startColor: Rgb = {
  mode: 'rgb',
  r: 45,
  g: 212,
  b: 191,
}

const endColor: Rgb = {
  mode: 'rgb',
  r: 192,
  g: 132,
  b: 252,
}

const interpolator = interpolate([startColor, endColor], 'rgb')

export function Integrations() {
  const [left, setLeft] = useState(47.5)

  const [revealed, setRevealed] = useState(0)

  const ref = useRef(null)

  const inView = useInView(ref, { once: true })

  const opentelemetryRef = useRef<HTMLElement>(null)

  const handleMouseMove = (event: React.MouseEvent) => {
    if (opentelemetryRef.current == null) return

    const bounds = opentelemetryRef.current.getBoundingClientRect()

    const mouseX = event.clientX - bounds.left

    setLeft((mouseX / bounds.width) * 100)
  }

  const replay = () => {
    setRevealed((revealed) => revealed + 1)
  }

  const paddedLeft = Math.max(left, 0)

  return (
    <article className="mx-auto w-full max-w-5xl space-y-8">
      <h2
        className={cn(
          inView ? 'animate-in' : 'animate-out',
          'fade-out fade-in slide-in-from-left-10 fill-mode-both duration-1000 ease-in-out',
          'bg-gradient-to-r from-sky-500 to-violet-500 bg-clip-text text-6xl font-semibold leading-[4.25rem] text-transparent',
        )}
      >
        Developer Experience
      </h2>

      <div ref={ref} className="integrations grid justify-center gap-12 p-4 md:grid-cols-2">
        <div className="space-y-4">
          <div>
            <h5>
              <span className="icon-[mdi--heart-outline] align-middle text-2xl"></span>
              <span className="align-middle">&nbsp;&nbsp;For DevOps</span>
            </h5>

            <h2 className="bg-gradient-to-r from-sky-400 to-violet-400 bg-clip-text text-3xl font-semibold text-transparent">
              OpenTelemetry
            </h2>
          </div>

          <p>
            Elysia has 1st party support for OpenTelemetry. Instrumentation is built-in, so you can
            easily monitor your services on regardless of the platform.
          </p>
        </div>

        <section
          ref={opentelemetryRef}
          className="relative flex flex-col gap-1 p-2"
          onMouseMove={handleMouseMove}
        >
          <div
            className="pointer absolute top-0 h-full bg-blue-300"
            style={{ width: '1.5px', left: `${paddedLeft}%` }}
          >
            <p
              className="absolute top-14 z-10 pl-2 font-mono text-sm font-semibold text-sky-500"
              style={{ left: paddedLeft > 80 ? '-4rem' : '0' }}
            >
              {((paddedLeft / 100) * totalTime).toFixed(2)}ms
            </p>
          </div>

          <p className="badge absolute right-2 top-2 z-10">POST /character/:id/chat</p>

          <button
            onClick={replay}
            className="btn absolute bottom-2 left-2 z-10 h-auto min-h-0 rounded-full bg-blue-500 px-2 py-1 text-xs font-semibold text-white backdrop-blur-sm hover:bg-blue-600"
          >
            Playback
          </button>

          <motion.div
            transition={{ duration: 1, ease: 'easeInOut' }}
            key={revealed}
            className="flex h-full w-full flex-col gap-1"
            viewport={{ once: true }}
            initial="hidden"
            whileInView="visible"
            variants={{
              hidden: { clipPath: 'inset(0% 100% 0% 0%)' },
              visible: { clipPath: 'inset(0% 0% 0% 0%)' },
            }}
          >
            {segments.map((segment, index) => {
              const gridColumnStart = Math.max(segment.start * 100, 1)
              const gridColumnEnd = segment.end * 100

              const interpolatedStart = interpolator(segment.start)
              const interpolatedEnd = interpolator(segment.end)

              const startColor = formatRgb255(interpolatedStart)
              const endColor = formatRgb255(interpolatedEnd)

              return (
                <div
                  key={index}
                  className="grid w-full"
                  style={{
                    gridTemplateColumns: 'repeat(100, minmax(0, 1fr))',
                  }}
                >
                  <div
                    className="relative h-3.5 rounded-full"
                    style={{
                      gridColumnStart,
                      gridColumnEnd,
                      backgroundImage: `linear-gradient(to right, ${startColor}, ${endColor})`,
                    }}
                  >
                    {segment.label && (
                      <span
                        className="absolute bottom-0 left-[110%] bg-clip-text text-xs font-semibold text-transparent"
                        style={{
                          backgroundImage: `linear-gradient(to right, ${startColor}, ${endColor})`,
                        }}
                      >
                        {segment.label}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </motion.div>
        </section>

        <div className="space-y-4">
          <div>
            <h5>
              <span className="icon-[mdi--heart-outline] align-middle text-2xl"></span>
              <span className="align-middle">&nbsp;&nbsp; For Frontend</span>
            </h5>

            <h2 className="bg-gradient-to-r from-purple-400 to-rose-400 bg-clip-text text-3xl font-semibold text-transparent">
              End-to-end Type Safety
            </h2>
          </div>

          <p>
            Like tRPC, Elysia provides type-safety from the backend to the frontend without code
            generation. The interaction between frontend and backend is type-checked at compile
            time.
          </p>
        </div>

        <section>
          <E2E />
        </section>
      </div>
    </article>
  )
}

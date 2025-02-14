import { animate, motion, useInView } from 'motion/react'
import { Fragment, useEffect, useRef, useState } from 'react'

export function Benchmarks() {
  const results = [
    {
      name: 'Elysia',
      runtime: 'Bun',
      requests: 2_454_631,
    },
    {
      name: 'Gin',
      runtime: 'Go',
      requests: 676_019,
    },
    {
      name: 'Spring',
      runtime: 'Java',
      requests: 506_087,
    },
    {
      name: 'Fastify',
      runtime: 'Node',
      requests: 415_600,
    },
    {
      name: 'Express',
      runtime: 'Node',
      requests: 113_117,
    },
    {
      name: 'Nest',
      runtime: 'Node',
      requests: 105_064,
    },
  ]

  const maxRequests = results.reduce((accummulated, result) => {
    return Math.max(accummulated, result.requests)
  }, 0)

  return (
    <article className="relative mx-auto flex w-full max-w-5xl flex-col gap-10 px-6 py-12 md:flex-row md:gap-24">
      <div className="bg-grid">
        <div className="fog h-full w-full" />
      </div>

      <header className="relative z-10 flex w-full flex-row justify-around md:max-w-[10.5rem] md:flex-col md:justify-center">
        <div className="">
          <h3 className="bg-gradient-to-r from-pink-400 to-fuchsia-400 bg-clip-text text-8xl font-bold text-transparent">
            21x
          </h3>

          <p>faster than Express</p>
        </div>

        <div className="">
          <h3 className="bg-gradient-to-r from-violet-400 to-pink-400 bg-clip-text text-8xl font-bold text-transparent">
            6x
          </h3>

          <p>faster than Fastify</p>
        </div>
      </header>

      <div className="relative">
        <ol className="grid grid-cols-12 gap-4">
          {results.map((result, index) => {
            if (index === 0) {
              return (
                <Fragment key={result.name}>
                  <li className="col-span-3 flex h-6 gap-8">
                    <h6 className="overflow-hidden text-ellipsis whitespace-nowrap">
                      <span className="bg-gradient-to-r from-violet-500 to-sky-500 bg-clip-text text-xl font-semibold text-transparent">
                        {result.name}
                      </span>
                      <span>&nbsp;{result.runtime}</span>
                    </h6>
                  </li>

                  <li className="col-span-9 h-6 w-full">
                    <BenchmarkBar
                      {...result}
                      className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-400 px-2 text-end text-sm font-semibold text-white"
                      max={maxRequests}
                      value={result.requests}
                    >
                      <AnimatedNumber to={result.requests} step={1_000} />
                      <span>&nbsp;reqs/s</span>
                    </BenchmarkBar>
                  </li>
                </Fragment>
              )
            }

            return (
              <Fragment key={result.name}>
                <li className="col-span-3 h-6">
                  <h6 className="overflow-hidden text-ellipsis whitespace-nowrap">
                    <span className="font-semibold">{result.name}</span>
                    <span>&nbsp;{result.runtime}</span>
                  </h6>
                </li>

                <li className="col-span-9 flex h-6 items-center gap-2">
                  <BenchmarkBar
                    {...result}
                    className="h-full rounded-full bg-gray-200 dark:bg-gray-600"
                    max={maxRequests}
                    value={result.requests}
                  />

                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    <AnimatedNumber to={result.requests} step={1_000} />
                  </p>
                </li>
              </Fragment>
            )
          })}
        </ol>

        <p className="mt-3 text-sm text-gray-400">
          <span>Measured in requests/second. Result from&nbsp;</span>

          <a
            href="https://www.techempower.com/benchmarks/#hw=ph&test=plaintext&section=data-r22"
            target="_blank"
            className="underline"
          >
            TechEmpower Benchmark
          </a>

          <span>, Round 22 (2023-10-17) in PlainText</span>
        </p>
      </div>
    </article>
  )
}

function AnimatedNumber(props: { from?: number; to?: number; step?: number }) {
  const { from = 0, to = 1, step = 1 } = props

  const [number, setNumber] = useState(from)

  const ref = useRef<HTMLSpanElement>(null)

  const inView = useInView(ref, { once: true })

  useEffect(() => {
    if (!inView) return

    const controls = animate(from, to, {
      duration: 1,
      onUpdate(value) {
        setNumber(Math.floor(value / step) * step)
      },
    })

    return () => controls.stop()
  }, [from, to, inView])

  return (
    <span ref={ref} className="">
      {number.toLocaleString()}
    </span>
  )
}

type BenchmarkBarProps = {
  value: number
  max: number
  className?: string
  children?: React.ReactNode
}

function BenchmarkBar(props: BenchmarkBarProps) {
  const { className, value, max, children } = props

  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      transition={{ duration: 1 }}
      variants={{
        hidden: {
          width: 0,
        },
        visible: {
          width: `${(value / max) * 100}%`,
        },
      }}
    >
      {children}
    </motion.div>
  )
}

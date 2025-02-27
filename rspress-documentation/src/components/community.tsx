import { useInView } from 'motion/react'
import { useRef } from 'react'

import { cn } from '@/utils/cn'

const tweets = [
  {
    id: 'AqueelMiq',
    user: 'Aqueel',
    image: '/tweets/aqueel.webp',
    content:
      'Jetfuel on bun at X! @shlomiatar who built the framework has an eye for picking the right tools for the job.',
    href: 'https://x.com/AqueelMiq/status/1822380943279296832',
  },
  {
    id: 'shlomiatar',
    user: 'Shlomi Atar',
    image: '/tweets/shlomi.webp',
    content:
      'also a shoutout to @saltyAom and the phenomenal Elysia js that is powering our server driven UI. Incredible work.',
    href: 'https://x.com/shlomiatar/status/1822381556142362734',
  },
  {
    id: 'htmx_org',
    user: 'htmx.org',
    image: '/tweets/htmx.webp',
    content: 'htmx works great w/ @bunjavascript, @elysiaJS and @tursodatabase btw',
    href: 'https://x.com/htmx_org/status/1792949584769224897',
  },
  {
    id: 'MarcLaventure',
    user: 'Marc Laventure',
    image: '/tweets/marc.webp',
    content: `both engineering+monetary contributions are paramount for OSS

we proudly sponsor dozens of projects: @elysiaJS @LitestarAPI @honojs @daveshanley @kevin_jahns @MarijnJH & help maintain repos+contribute to OSS at blistering cadence.

it's @scalar's ethos to be a catalyst for OSS`,
    href: 'https://x.com/MarcLaventure/status/1773751085792174246',
  },
  {
    id: 'jarredsumner',
    user: 'Jarred Sumner',
    image: '/tweets/jarred.webp',
    content:
      'You can use Express with Bun, but often we see people using Elysia, Hono, or Bun.serve() directly.',
    href: 'https://x.com/jarredsumner/status/1781132294692233609',
  },
  {
    id: 'runyasak',
    user: 'Runyasak Ch. 💚',
    image: '/tweets/runyasak.webp',
    content: `Started using @elysiaJS to create a Discord Bot and found the type system beautifully easy. DX is fantastic and coding is fun!

Use @DrizzleORM with PostgreSQL. So much easier than I've used before.

ElysiaJS has proved to me that great performance and DX can live together. 😎`,
    href: 'https://x.com/runyasak/status/1797618641648968117',
  },
  {
    id: 'hd_nvim',
    user: 'Herrington Darkholme',
    image: '/tweets/herrington.webp',
    content:
      "Was introduced to @elysiaJS today and it looks pretty solid. end-to-end type safety/guard/swapper are killer features of the modern web! (and it's fast)",
    href: 'https://x.com/hd_nvim/status/1735182378036027650',
  },
  {
    id: 'scalar',
    user: 'scalar.com',
    image: '/tweets/scalar.webp',
    content: 'so excited to be part of the amazing @elysiaJS community!',
    href: 'https://x.com/scalar/status/1744024831014920403',
  },
  {
    id: 'josedonato__',
    user: 'José Donato 🦋',
    image: '/tweets/josedonato.webp',
    content: `handling tables with ~350k rows like it's nothing.

Working on allowing @ag_grid server side row model when connecting a custom backend to @openbb_finance Terminal Pro.

Backend in @elysiaJS + @bunjsproject.`,
    href: 'https://x.com/josedonato__/status/1815706393367703890',
  },
  {
    id: 'pilcrow',
    user: 'pilcrowonpaper',
    image: '/tweets/pilcrow.webp',
    content:
      'Just in time for Bun 1.0 - Lucia 2.5 now supports @elysiajs out of the box!! You can also use Bun.serve() directly as well. This release also comes with 2 new OAuth providers, Strava and AWS Cognito!',
    href: 'https://x.com/pilcrowonpaper/status/1699766618665181308',
  },
  {
    id: 'MikroORM',
    user: 'MikroORM',
    image: '/tweets/mikroorm.webp',
    content:
      "I've been playing a bit with @bunjavascript and @elysiaJS, need to do a few more tweaks before the release, but next version should work more natively with bun when it comes to TS support detection, e.g. the CLI works without ts-node installed.",
    href: 'https://x.com/MikroORM/status/1821993062114967711',
  },
]

const columns = Array.from({ length: 3 }, (_, index) => index)

export function Community() {
  const ref = useRef(null)

  const inView = useInView(ref, { once: true })

  return (
    <article className="mx-auto w-full max-w-5xl space-y-4 p-4">
      <h1 className="text-center text-2xl font-medium text-gray-500 dark:text-gray-400">
        <p
          className={cn(
            inView ? 'animate-in' : 'animate-out',
            'fade-out fade-in slide-in-from-top-4 fill-mode-both duration-1000 ease-in-out',
            'bg-gradient-to-r from-rose-400 to-amber-400 bg-clip-text text-center text-7xl font-semibold leading-[6rem] text-transparent',
          )}
        >
          Community
        </p>
      </h1>

      <ul
        ref={ref}
        className={cn(
          inView ? 'animate-in' : 'animate-out',
          'fade-out fade-in slide-in-from-top-4 fill-mode-both delay-300 duration-1000 ease-in-out',
          'grid gap-4 md:grid-cols-3',
        )}
      >
        {columns.map((column) => {
          return (
            <li
              key={column}
              className={cn(column % 2 ? 'py-0' : 'lg:py-12', 'flex flex-col gap-4')}
            >
              {tweets
                .filter((_, index) => index % columns.length === column)
                .map((tweet) => {
                  return (
                    <a
                      key={tweet.id}
                      href={tweet.href}
                      className="btn text-transform-none hover:border-neutral-content transition:transform h-fit justify-start gap-4 rounded-xl border p-4 text-left font-normal hover:-translate-y-1"
                    >
                      <div className="flex items-center gap-4">
                        <img loading="lazy" className="h-12 w-12 rounded-full" src={tweet.image} />

                        <div>
                          <p className="font-bold text-gray-700 dark:text-gray-300">{tweet.user}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">@{tweet.id}</p>
                        </div>
                      </div>

                      <p className="whitespace-pre-line text-base">{tweet.content}</p>
                    </a>
                  )
                })}
            </li>
          )
        })}
      </ul>
    </article>
  )
}

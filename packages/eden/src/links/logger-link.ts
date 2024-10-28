import type { AnyElysia } from 'elysia'

import { constNoop } from '../utils/noop'
import { Observable } from './internal/observable'
import type { EdenLink, Operation, OperationResultEnvelope } from './internal/operation'
import { tap } from './internal/operators'

type ConsoleEsque = {
  log: (...args: any[]) => void
  error: (...args: any[]) => void
}

type EnableFnOptions =
  | {
      direction: 'down'
      result: OperationResultEnvelope<unknown>
    }
  | (Operation & {
      direction: 'up'
    })

type EnabledFn = (opts: EnableFnOptions) => boolean

type LoggerLinkFnOptions = Operation &
  (
    | {
        /**
         * Request result
         */
        direction: 'down'
        result: OperationResultEnvelope<unknown>
        elapsedMs: number
      }
    | {
        /**
         * Request was just initialized
         */
        direction: 'up'
      }
  )

type LoggerLinkFn = (opts: LoggerLinkFnOptions) => void

type ColorMode = 'ansi' | 'css' | 'none'

export interface LoggerLinkOptions {
  logger?: LoggerLinkFn

  enabled?: EnabledFn

  /**
   * Used in the built-in defaultLogger
   */
  console?: ConsoleEsque

  /**
   * Color mode
   * @default typeof window === 'undefined' ? 'ansi' : 'css'
   */
  colorMode?: ColorMode

  /**
   * Include context in the log - defaults to false unless `colorMode` is 'css'
   */
  withContext?: boolean
}

const palettes = {
  css: {
    query: ['72e3ff', '3fb0d8'],
    mutation: ['c5a3fc', '904dfc'],
    subscription: ['ff49e1', 'd83fbe'],
  },
  ansi: {
    regular: {
      // Cyan background, black and white text respectively
      query: ['\x1b[30;46m', '\x1b[97;46m'],

      // Magenta background, black and white text respectively
      mutation: ['\x1b[30;45m', '\x1b[97;45m'],

      // Green background, black and white text respectively
      subscription: ['\x1b[30;42m', '\x1b[97;42m'],
    },
    bold: {
      query: ['\x1b[1;30;46m', '\x1b[1;97;46m'],
      mutation: ['\x1b[1;30;45m', '\x1b[1;97;45m'],
      subscription: ['\x1b[1;30;42m', '\x1b[1;97;42m'],
    },
  },
} as const

export type ExtendedLoggerFnOptions = LoggerLinkFnOptions & {
  colorMode: ColorMode
  withContext?: boolean
}

function constructPartsAndArgs(opts: ExtendedLoggerFnOptions) {
  const { direction, type, withContext, id, params } = opts

  const parts: string[] = []
  const args: any[] = []

  const path = params.path ?? ''

  if (opts.colorMode === 'none') {
    parts.push(direction === 'up' ? '>>' : '<<', type, `#${id}`, path)
  } else if (opts.colorMode === 'ansi') {
    const [lightRegular, darkRegular] = palettes.ansi.regular[type]
    const [lightBold, darkBold] = palettes.ansi.bold[type]
    const reset = '\x1b[0m'

    parts.push(
      direction === 'up' ? lightRegular : darkRegular,
      direction === 'up' ? '>>' : '<<',
      type,
      direction === 'up' ? lightBold : darkBold,
      `#${id}`,
      path,
      reset,
    )
  } else {
    // css color mode
    const [light, dark] = palettes.css[type]
    const css = `
    background-color: #${direction === 'up' ? light : dark};
    color: ${direction === 'up' ? 'black' : 'white'};
    padding: 2px;
  `

    parts.push('%c', direction === 'up' ? '>>' : '<<', type, `#${id}`, `%c${path}%c`, '%O')
    args.push(css, `${css}; font-weight: bold;`, `${css}; font-weight: normal;`)
  }

  if (direction === 'up') {
    args.push(withContext ? { params, context: opts.context } : { params })
  } else {
    args.push({
      params,
      result: opts.result,
      elapsedMs: opts.elapsedMs,
      ...(withContext && { context: opts.context }),
    })
  }

  return { parts, args }
}

export type LoggerOptions = {
  c?: ConsoleEsque
  colorMode?: ColorMode
  withContext?: boolean
}

/**
 * Maybe this should be moved to it's own package?
 */
function defaultLogger(options: LoggerOptions): LoggerLinkFn {
  const { c = console, colorMode = 'css', withContext } = options

  return (props) => {
    const params = props.params

    const { parts, args } = constructPartsAndArgs({ ...props, colorMode, params, withContext })

    const fn: 'error' | 'log' =
      props.direction === 'down' &&
      props.result &&
      (props.result instanceof Error || 'error' in props.result)
        ? 'error'
        : 'log'

    c[fn].apply(null, [parts.join(' ')].concat(args))
  }
}

/**
 * @see https://trpc.io/docs/v11/client/links/loggerLink
 */
export function loggerLink<T extends AnyElysia>(options?: LoggerLinkOptions): EdenLink<T> {
  const enabled = options?.enabled ?? constNoop(true)

  const colorMode = options?.colorMode ?? (typeof window === 'undefined' ? 'ansi' : 'css')

  const withContext = options?.withContext ?? colorMode === 'css'

  const logger = options?.logger ?? defaultLogger({ c: options?.console, colorMode, withContext })

  return (_runtime) => {
    return ({ operation, next }) => {
      return new Observable((observer) => {
        if (enabled({ ...operation, direction: 'up' })) {
          logger({ ...operation, direction: 'up' })
        }

        const requestStartTime = Date.now()

        function logResult(result: OperationResultEnvelope<unknown>) {
          const elapsedMs = Date.now() - requestStartTime

          if (enabled({ ...operation, direction: 'down', result })) {
            logger({ ...operation, direction: 'down', elapsedMs, result })
          }
        }

        return next(operation)
          .pipe(
            tap({
              next: (result) => {
                logResult(result)
              },
              error: (result) => {
                logResult(result)
              },
            }),
          )
          .subscribe(observer)
      })
    }
  }
}

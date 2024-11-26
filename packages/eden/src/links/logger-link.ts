import type { AnyElysia } from 'elysia'

import { constNoop } from '../utils/noop'
import { Observable } from './internal/observable'
import type { EdenLink, Operation, OperationResultEnvelope } from './internal/operation'
import { tap } from './internal/operators'

type ConsoleEsque = {
  log: (...arguments_: any[]) => void
  error: (...arguments_: any[]) => void
}

type EnableFunctionOptions =
  | {
      direction: 'down'
      result: OperationResultEnvelope<unknown>
    }
  | (Operation & {
      direction: 'up'
    })

type EnabledFunction = (options: EnableFunctionOptions) => boolean

type LoggerLinkFunctionOptions = Operation &
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

type LoggerLinkFunction = (options: LoggerLinkFunctionOptions) => void

type ColorMode = 'ansi' | 'css' | 'none'

export interface LoggerLinkOptions {
  logger?: LoggerLinkFunction

  enabled?: EnabledFunction

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
      query: ['\u001B[30;46m', '\u001B[97;46m'],

      // Magenta background, black and white text respectively
      mutation: ['\u001B[30;45m', '\u001B[97;45m'],

      // Green background, black and white text respectively
      subscription: ['\u001B[30;42m', '\u001B[97;42m'],
    },
    bold: {
      query: ['\u001B[1;30;46m', '\u001B[1;97;46m'],
      mutation: ['\u001B[1;30;45m', '\u001B[1;97;45m'],
      subscription: ['\u001B[1;30;42m', '\u001B[1;97;42m'],
    },
  },
} as const

export type ExtendedLoggerFnOptions = LoggerLinkFunctionOptions & {
  colorMode: ColorMode
  withContext?: boolean
}

function constructPartsAndArguments(options: ExtendedLoggerFnOptions) {
  const { direction, type, withContext, id, params } = options

  const parts: string[] = []
  const arguments_: any[] = []

  const path = params.path ?? ''

  if (options.colorMode === 'none') {
    parts.push(direction === 'up' ? '>>' : '<<', type, `#${id}`, path)
  } else if (options.colorMode === 'ansi') {
    const [lightRegular, darkRegular] = palettes.ansi.regular[type]
    const [lightBold, darkBold] = palettes.ansi.bold[type]
    const reset = '\u001B[0m'

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
    arguments_.push(css, `${css}; font-weight: bold;`, `${css}; font-weight: normal;`)
  }

  if (direction === 'up') {
    arguments_.push(withContext ? { params, context: options.context } : { params })
  } else {
    arguments_.push({
      params,
      result: options.result,
      elapsedMs: options.elapsedMs,
      ...(withContext && { context: options.context }),
    })
  }

  return { parts, args: arguments_ }
}

export type LoggerOptions = {
  c?: ConsoleEsque
  colorMode?: ColorMode
  withContext?: boolean
}

/**
 * Maybe this should be moved to it's own package?
 */
function defaultLogger(options: LoggerOptions): LoggerLinkFunction {
  const { c = console, colorMode = 'css', withContext } = options

  return (properties) => {
    const parameters = properties.params

    const { parts, args } = constructPartsAndArguments({
      ...properties,
      colorMode,
      params: parameters,
      withContext,
    })

    const function_: 'error' | 'log' =
      properties.direction === 'down' &&
      properties.result &&
      (properties.result instanceof Error || 'error' in properties.result)
        ? 'error'
        : 'log'

    // eslint-disable-next-line unicorn/prefer-reflect-apply
    c[function_].apply(null, [parts.join(' '), ...args])
  }
}

/**
 * @see https://trpc.io/docs/v11/client/links/loggerLink
 */
export function loggerLink<T extends AnyElysia>(options?: LoggerLinkOptions): EdenLink<T> {
  const enabled = options?.enabled ?? constNoop(true)

  const colorMode = options?.colorMode ?? (typeof globalThis === 'undefined' ? 'ansi' : 'css')

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

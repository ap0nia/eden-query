/**
 * FIXME: https://github.com/wooorm/parse-entities/issues/19
 */

import type { Root as Root } from 'hast'
import type { VFile } from 'vfile'

// Asynchronous modules can delay the WebWorker initialization.
// Do not await them at the top-level.

const processorModule = import('$lib/unified/processor')

const shikiModule = import('$lib/shiki')

const twoslashModule = import('$lib/twoslash')

export interface UnifiedWorkerMessage {
  clientId?: string | number | null

  requestId?: string | number | null
}

export interface ParseAndRunIncoming extends UnifiedWorkerMessage {
  type: 'parse-and-run'

  content?: string | null

  vfile?: VFile
}

export interface LoadLanguageIncoming extends UnifiedWorkerMessage {
  type: 'load-language'

  languages: Parameters<typeof highlighter.loadLanguage>

  clientId?: string | number

  requestId?: string | number
}

export interface LoadLanguageOutgoing extends UnifiedWorkerMessage {
  type: 'load-language'
}

export interface PrepareTypesIncoming extends UnifiedWorkerMessage {
  type: 'prepare-types'

  source: string
}

export interface ParseAndRunOutgoing extends UnifiedWorkerMessage {
  type: 'parse-and-run'

  tree?: Root

  vfile?: VFile
}

export interface PrepareTypesOutgoing extends UnifiedWorkerMessage {
  type: 'prepare-types'
}

export type UnifiedIncomingMessage =
  | ParseAndRunIncoming
  | LoadLanguageIncoming
  | PrepareTypesIncoming

export type UnifiedOutgoingMessage =
  | ParseAndRunOutgoing
  | PrepareTypesOutgoing
  | LoadLanguageOutgoing

/**
 * @todo Maybe use a cache to optimize repeated calculations.
 */
export const cache = {} as Partial<{
  [K in UnifiedIncomingMessage['type']]: Record<
    string,
    Extract<UnifiedOutgoingMessage, { type: K }>
  >
}>

let events: MessageEvent<UnifiedIncomingMessage>[] = []

let parseAndRun: Awaited<typeof processorModule>['parseAndRun']

let highlighter: Awaited<typeof shikiModule>['highlighter']

let twoslash: Awaited<typeof twoslashModule>['twoslash']

let lock = false

addEventListener('message', handleEvent)

async function handleEvent(event: MessageEvent<UnifiedIncomingMessage>) {
  events.push(event)

  if (lock) {
    return
  }

  lock = true

  while (events.length) {
    /**
     * Stable copy of the events currently being processed.
     *
     * If new events are added during this loop, they will be processed in the next loop iteration.
     */
    const eventsCopy = [...events]

    // Events are grouped and executed in priority.
    // 1. load-language events.
    // 2. prepare-type events.
    // 3. parse-and-run events. This must run after languages and Twoslash types have been prepared.

    const loadLanguageEvents = eventsCopy.filter(
      (e) => e.data.type === 'load-language',
    ) as MessageEvent<LoadLanguageIncoming>[]

    const prepareTypesEvents = eventsCopy.filter(
      (e) => e.data.type === 'prepare-types',
    ) as MessageEvent<PrepareTypesIncoming>[]

    const parseAndRunEvents = eventsCopy.filter(
      (e) => e.data.type === 'parse-and-run',
    ) as MessageEvent<ParseAndRunIncoming>[]

    if (loadLanguageEvents.length) {
      // Since individual languages may fail and cause the entire call to fail.
      // Load each language separately so that failed languages do not block others.

      const languages = loadLanguageEvents.flatMap((event) => event.data.languages)

      const distinctLanguages = Array.from(new Set(languages))

      highlighter ||= (await shikiModule).highlighter

      const promises = distinctLanguages.map(async (language) => {
        await highlighter.loadLanguage(language).catch((err) => {
          console.log('Error loading language', err)
        })
      })

      await Promise.allSettled(promises)

      loadLanguageEvents.forEach((event) => {
        const message: UnifiedOutgoingMessage = {
          type: 'load-language',
          clientId: event.data.clientId,
          requestId: event.data.requestId,
        }

        postMessage(message)
      })
    }

    if (prepareTypesEvents.length) {
      const results: Record<string, Awaited<ReturnType<typeof twoslash.prepareTypes>>> = {}

      const promises = prepareTypesEvents.map(async (event) => {
        const message: UnifiedOutgoingMessage = {
          type: 'prepare-types',
          clientId: event.data.clientId,
          requestId: event.data.requestId,
        }

        if (event.data.clientId) {
          const result = results[event.data.clientId]

          if (result) {
            postMessage(message)
            return result
          }
        }

        twoslash ||= (await twoslashModule).twoslash

        const result = await twoslash.prepareTypes(event.data.source).catch((err) => {
          console.log('Error preparing types', err)
        })

        if (event.data.clientId) {
          results[event.data.clientId] = result
        }

        postMessage(message)
      })

      await Promise.allSettled(promises)
    }

    if (parseAndRunEvents.length) {
      const results: Record<string, Awaited<ReturnType<typeof parseAndRun>>> = {}

      const promises = parseAndRunEvents.map(async (event) => {
        if (event.data.clientId) {
          const result = results[event.data.clientId]

          if (result) {
            const [tree, vfile] = result

            const message: UnifiedOutgoingMessage = {
              type: 'parse-and-run',
              tree,
              vfile,
              clientId: event.data.clientId,
              requestId: event.data.requestId,
            }

            postMessage(message)

            return
          }
        }

        parseAndRun ||= (await processorModule).parseAndRun

        const result = await parseAndRun(event.data.content, event.data.vfile).catch((err) => {
          console.log('Error parsing', err)
        })

        if (result && event.data.clientId) {
          results[event.data.clientId] = result
        }

        const [tree, vfile] = result ?? []

        const message: UnifiedOutgoingMessage = {
          type: 'parse-and-run',
          tree,
          vfile,
          clientId: event.data.clientId,
          requestId: event.data.requestId,
        }

        postMessage(message)
      })

      await Promise.allSettled(promises)
    }

    // Events that were added during this loop will not be present in the copied array.
    events = events.filter((event) => !eventsCopy.includes(event))
  }

  lock = false
}

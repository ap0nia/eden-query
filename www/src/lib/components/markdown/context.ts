import { getContext, setContext } from 'svelte'
import { VFile } from 'vfile'

import { browser } from '$app/environment'
import EventEmitter from '$lib/event-emitter'
import { highlighter } from '$lib/shiki'
import { twoslash } from '$lib/twoslash'
import { parseAndRun } from '$lib/unified/processor'
import type { UnifiedIncomingMessage, UnifiedOutgoingMessage } from '$lib/workers/unified'

export const emitter = new EventEmitter<{ message: MessageEvent<UnifiedOutgoingMessage> }>()

const worker = browser ? new (await import('$lib/workers/unified?worker')).default() : undefined

const dispatcher = emitter.dispatchEvent.bind(emitter, 'message')

/**
 * Request IDs mapped to resolvers.
 * Pending request promises for the worker.
 */
const resolvers: Record<string | number, ReturnType<typeof Promise.withResolvers>> = {}

worker?.addEventListener('message', dispatcher)

function messageResolver(event: MessageEvent<UnifiedOutgoingMessage>) {
  if (event.data.requestId) {
    const deferred = resolvers[event.data.requestId]

    if (deferred) {
      deferred.resolve(event.data)

      delete resolvers[event.data.requestId]
    }
  }
}

emitter.addEventListener('message', messageResolver)

let requestId = 0

export async function postMessage(message: UnifiedIncomingMessage, workerEnabled?: boolean | null) {
  requestId++

  const resolvedWorker = (workerEnabled != false && worker) || undefined

  if (resolvedWorker) {
    const deferred = Promise.withResolvers()

    resolvers[requestId] = deferred

    resolvedWorker.postMessage({ ...message, requestId })

    return deferred.promise
  }

  const clientId = message.clientId

  switch (message.type) {
    case 'load-language': {
      // Since individual languages may fail and cause the entire call to fail.
      // Load each language separately so that failed languages do not block others.

      const promises = message.languages.map(async (language) => {
        await highlighter.loadLanguage(language).catch((err) => {
          console.log('Error loading language', err)
        })
      })

      const result = await Promise.allSettled(promises)

      emitter.dispatchEvent(
        'message',
        new MessageEvent('message', {
          data: {
            type: 'load-language',
            clientId,
            requestId,
          },
        }),
      )

      return result
    }

    case 'prepare-types': {
      const result = await twoslash.prepareTypes(message.source).catch((err) => {
        console.log('Error preparing types', err)
      })

      emitter.dispatchEvent(
        'message',
        new MessageEvent('message', {
          data: {
            type: 'prepare-types',
            clientId,
            requestId,
          },
        }),
      )

      return result
    }

    case 'parse-and-run': {
      const result = await parseAndRun(message.content, message.vfile).catch((err) => {
        console.log('Error parsing and running', err)
      })

      const [tree, vfile] = result ?? []

      emitter.dispatchEvent(
        'message',
        new MessageEvent('message', {
          data: {
            type: 'parse-and-run',
            tree,
            vfile,
            clientId,
            requestId,
          },
        }),
      )

      return result
    }
  }
}

/**
 * Context set by the root markdown component, e.g. the one parsing the content string.
 */
export interface MarkdownContext {
  /**
   */
  content?: string | null

  /**
   */
  vfile?: VFile

  /**
   * A bound version of {@link postMessage} with the configuration from the root Markdown component.
   */
  postMessage: (message: UnifiedIncomingMessage) => ReturnType<typeof postMessage>
}

export const MARKDOWN_CONTEXT_SYMBOL = Symbol.for('markdown')

export function setMarkdownContext(context: MarkdownContext) {
  setContext(MARKDOWN_CONTEXT_SYMBOL, context)
}

export function getMarkdownContext() {
  return getContext<MarkdownContext>(MARKDOWN_CONTEXT_SYMBOL)
}

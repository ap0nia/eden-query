import { bundledLanguagesInfo, createHighlighter, createOnigurumaEngine } from 'shiki'
import { getWasmInstance } from 'shiki/wasm'

let loadQueue: Promise<any>[] = []

let onLoaded: (() => void) | undefined

export interface HighlighterEvents {
  languageLoaded: (...args: string[]) => void
}

export const listeners = {} as {
  [K in keyof HighlighterEvents]: Set<HighlighterEvents[K]>
}

/**
 * Mapping of aliases to their original language names.
 */
export const aliasLanguages = new Map(
  bundledLanguagesInfo.flatMap((info) => {
    const aliases = info.aliases ?? []

    const entries = [
      [info.name, info.name] as const,
      ...aliases.map((alias) => [alias, info.name] as const),
    ]

    return entries
  }),
)

export const engine = createOnigurumaEngine(getWasmInstance)

export const baseHighlighter = await createHighlighter({
  themes: ['github-light', 'github-dark'],
  langs: [],
  engine,
})

export const loadLanguage: typeof baseHighlighter.loadLanguage = async (...args) => {
  const beforeLoadedLanguages = new Set(highlighter.getLoadedLanguages())

  const promise = baseHighlighter.loadLanguage(...args)

  loadQueue.push(promise)

  const result = await promise

  if (!onLoaded) {
    onLoaded = () => {
      const afterLoadedLanguages = new Set(highlighter.getLoadedLanguages())

      const allLanguages = beforeLoadedLanguages.union(afterLoadedLanguages)

      if (beforeLoadedLanguages.size !== afterLoadedLanguages.size) {
        const newLanguages = allLanguages.difference(beforeLoadedLanguages)

        listeners.languageLoaded?.forEach((listener) => listener(...newLanguages))
      }

      loadQueue = []

      onLoaded = undefined
    }

    Promise.allSettled(loadQueue).then(onLoaded)
  }

  return result
}

/**
 * Shared, singleton extended shiki highlighter.
 *
 * Primary extension is listeners for events such as loading new languages.
 */
export const highlighter = {
  ...baseHighlighter,
  loadLanguage,
  on: <T extends keyof HighlighterEvents>(key: T, callback: HighlighterEvents[T]) => {
    listeners[key] ??= new Set()
    listeners[key].add(callback)
    return () => listeners[key].delete(callback)
  },
  off: <T extends keyof HighlighterEvents>(key: T, callback: HighlighterEvents[T]) => {
    listeners[key]?.delete(callback)
  },
}

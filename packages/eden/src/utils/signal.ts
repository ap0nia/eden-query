import type { Nullish } from './types'

/**
 * Like `Promise.all()` but for abort signals
 * - When all signals have been aborted, the merged signal will be aborted
 * - If one signal is `null`, no signal will be aborted
 */
export function linkAbortSignals(...signals: Array<AbortSignal | Nullish>): AbortSignal {
  const ac = new AbortController()

  let count = 0

  let abortedCount = 0

  const onAbort = () => {
    if (++abortedCount === count) {
      ac.abort()
    }
  }

  for (const signal of signals) {
    if (signal?.aborted) {
      onAbort()
    } else if (signal) {
      signal?.addEventListener('abort', onAbort, {
        once: true,
      })
      count++
    }
  }

  return ac.signal
}

/**
 * Like `Promise.race` but for abort signals
 *
 * Basically, a ponyfill for
 * [`AbortSignal.any`](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal/any_static).
 */
export function raceAbortSignals(...signals: Array<AbortSignal | Nullish>): AbortSignal {
  const ac = new AbortController()

  for (const signal of signals) {
    if (signal?.aborted) {
      ac.abort()
    } else {
      signal?.addEventListener('abort', () => ac.abort(), { once: true })
    }
  }

  return ac.signal
}

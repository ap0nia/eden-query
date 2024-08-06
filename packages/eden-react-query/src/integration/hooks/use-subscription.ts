import type { EdenRequestParams } from '@elysiajs/eden'
import { hashKey, skipToken } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'

import type { EdenContextState } from '../../context'
import { getQueryKey } from '../internal/query-key'

/**
 * @todo Eden-subscription?
 */
export interface EdenUseSubscriptionOptions<TOutput, TError> {
  enabled?: boolean
  onStarted?: () => void
  onData: (data: TOutput) => void
  onError?: (err: TError) => void
}

export function edenUseSubscription(
  path: readonly string[],
  input: any,
  opts: EdenUseSubscriptionOptions<any, any>,
  context: EdenContextState<any, any>,
) {
  const enabled = opts?.enabled ?? input !== skipToken

  const queryKey = hashKey(getQueryKey(path, input, 'any'))

  const optsRef = useRef<typeof opts>(opts)

  optsRef.current = opts

  const { client } = context

  useEffect(() => {
    if (!enabled) {
      return
    }

    let isStopped = false

    const params: EdenRequestParams = { path: path.join('.'), ...input }

    const subscription = client.subscription(params, {
      onStarted: () => {
        if (!isStopped) {
          optsRef.current.onStarted?.()
        }
      },
      onData: (data) => {
        if (!isStopped) {
          optsRef.current.onData(data)
        }
      },
      onError: (err) => {
        if (!isStopped) {
          optsRef.current.onError?.(err)
        }
      },
    })

    return () => {
      isStopped = true
      subscription.unsubscribe()
    }
  }, [queryKey, enabled])
}

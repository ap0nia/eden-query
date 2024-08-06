/**
 * @todo Eden-subscription?
 */
export interface EdenCreateSubscriptionOptions<TOutput, TError> {
  enabled?: boolean
  onStarted?: () => void
  onData: (data: TOutput) => void
  onError?: (err: TError) => void
}

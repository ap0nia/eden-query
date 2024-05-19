import { createChain } from '../links/internals/create-chain'
import {
  type InferObservableValue,
  promisifyObservable,
  type Unsubscribable,
} from '../links/internals/observable'
import type { EdenLink, OperationLink, OperationType } from '../links/internals/operation'
import { share } from '../links/internals/operators'
import type { AnyElysia } from '../types'
import type { OperationContext } from './operation'
import type { EdenRequestParams } from './resolve'

export type EdenSubscriptionObserver<TValue, TError> = {
  onStarted: () => void
  onData: (value: TValue) => void
  onError: (err: TError) => void
  onStopped: () => void
  onComplete: () => void
}

export type EdenClientOptions<T extends AnyElysia> = {
  links: EdenLink<T>[]
}

/**
 * TODO: placeholder for TRPCClientError<TInferrable>.
 */
export type EdenClientError<_T extends AnyElysia> = any

export type EdenClientRuntime = {}

/**
 * The request options that are passed
 */
export type EdenClientInternalRequestOptions = {
  type: OperationType
  context?: OperationContext
  params: EdenRequestParams
}

export type EdenClientPromisifyRequestOptions = EdenClientInternalRequestOptions & {
  signal?: AbortSignal
}

export type EdenClientRequestOptions = {
  context?: OperationContext
  signal?: AbortSignal
}

export class EdenClient<T extends AnyElysia = AnyElysia> {
  private readonly links: OperationLink<T>[]

  public readonly runtime: EdenClientRuntime

  private requestId: number

  constructor(options: EdenClientOptions<T>) {
    this.requestId = 0

    this.runtime = {}

    this.links = options.links.map((link) => link(this.runtime))
  }

  private $request<TInput = unknown, TOutput = unknown>(options: EdenClientInternalRequestOptions) {
    const chain$ = createChain<T, TInput, TOutput>({
      links: this.links as OperationLink<any, any, any>[],
      operation: {
        id: ++this.requestId,
        ...options,
      },
    })
    return chain$.pipe(share())
  }

  private promisifyRequest<TInput = unknown, TOutput = unknown>(
    options: EdenClientPromisifyRequestOptions,
  ): Promise<TOutput> {
    const req$ = this.$request<TInput, TOutput>(options)

    type TValue = InferObservableValue<typeof req$>

    const { promise, abort } = promisifyObservable<TValue>(req$)

    const abortablePromise = new Promise<TOutput>((resolve, reject) => {
      options.signal?.addEventListener('abort', abort)

      promise
        .then((envelope) => {
          resolve((envelope.result as any).data)
        })
        .catch((err) => {
          reject(TRPCClientError.from(err))
        })
    })

    return abortablePromise
  }

  public query(params: EdenRequestParams, options?: EdenClientRequestOptions) {
    return this.promisifyRequest({
      type: 'query',
      params,
      context: options?.context,
      signal: options?.signal,
    })
  }

  public mutation(params: EdenRequestParams, options?: EdenClientRequestOptions) {
    return this.promisifyRequest({
      type: 'mutation',
      params,
      context: options?.context,
      signal: options?.signal,
    })
  }

  public subscription(
    params: EdenRequestParams,
    options?: Partial<EdenSubscriptionObserver<unknown, EdenClientError<T>>> &
      EdenClientRequestOptions,
  ): Unsubscribable {
    const observable = this.$request({
      type: 'subscription',
      params,
      context: options?.context,
    })

    const $observable = observable.subscribe({
      next: (envelope) => {
        if (envelope.result.type === 'started') {
          options?.onStarted?.()
        } else if (envelope.result.type === 'stopped') {
          options?.onStopped?.()
        } else {
          options?.onData?.(envelope.result.data)
        }
      },
      error: (err) => {
        options?.onError?.(err)
      },
      complete: () => {
        options?.onComplete?.()
      },
    })

    return $observable
  }
}

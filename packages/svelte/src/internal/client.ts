import type { EdenRequestOptions } from '../internal/config'
import { createChain } from '../links/create-chain'
import type { OperationLink, OperationType } from '../links/internals/operation'
import {
  type InferObservableValue,
  promisifyObservable,
  type Unsubscribable,
} from '../links/observable'
import { share } from '../links/operators'
import type { AnyElysia } from '../types'
import type { InferRouteError } from './infer'
import type { OperationContext } from './operation'

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

export type EdenClientRuntime = {}

export class EdenClient<T extends AnyElysia = AnyElysia> {
  private readonly links: OperationLink<T>[]

  public readonly runtime: EdenClientRuntime

  private requestId: number

  constructor(options: EdenClientOptions<T>) {
    this.requestId = 0

    this.runtime = {}

    this.links = options.links.map((link) => link(this.runtime))
  }

  private $request<TInput = unknown, TOutput = unknown>({
    type,
    input,
    path,
    context = {},
  }: {
    type: OperationType
    input: TInput
    path: string
    context?: OperationContext
  }) {
    const chain$ = createChain<any, TInput, TOutput>({
      links: this.links,
      operation: {
        id: ++this.requestId,
        type,
        path,
        input,
        context,
      },
    })
    return chain$.pipe(share())
  }

  private requestAsPromise<TInput = unknown, TOutput = unknown>(opts: {
    type: OperationType
    input: TInput
    path: string
    context?: OperationContext
    signal?: AbortSignal
  }): Promise<TOutput> {
    const req$ = this.$request<TInput, TOutput>(opts)

    type TValue = InferObservableValue<typeof req$>

    const { promise, abort } = promisifyObservable<TValue>(req$)

    const abortablePromise = new Promise<TOutput>((resolve, reject) => {
      opts.signal?.addEventListener('abort', abort)

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

  public query(path: string, input?: unknown, opts?: TRPCRequestOptions) {
    return this.requestAsPromise({
      type: 'query',
      path,
      input,
      context: opts?.context,
      signal: opts?.signal,
    })
  }

  public mutation(path: string, input?: unknown, opts?: TRPCRequestOptions) {
    return this.requestAsPromise({
      type: 'mutation',
      path,
      input,
      context: opts?.context,
      signal: opts?.signal,
    })
  }

  public subscription(
    path: string,
    input: unknown,
    opts: Partial<EdenSubscriptionObserver<unknown, InferRouteError>> & EdenRequestOptions,
  ): Unsubscribable {
    const observable$ = this.$request({
      type: 'subscription',
      path,
      input,
      context: opts?.context,
    })

    return observable$.subscribe({
      next(envelope) {
        if (envelope.result.type === 'started') {
          opts.onStarted?.()
        } else if (envelope.result.type === 'stopped') {
          opts.onStopped?.()
        } else {
          opts.onData?.(envelope.result.data)
        }
      },
      error(err) {
        opts.onError?.(err)
      },
      complete() {
        opts.onComplete?.()
      },
    })
  }
}

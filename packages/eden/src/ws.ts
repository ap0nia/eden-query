/**
 * Eden WS implementation.
 *
 * @see https://github.com/elysiajs/eden/blob/7b982cf6469d809cd561dd0ad59e83178ad56489/src/treaty2/ws.ts#L5
 */
import type { InputSchema, MaybeArray } from 'elysia'

import {
  type CombinedDataTransformer,
  type DataTransformerOptions,
  getDataTransformer,
} from './links'
import { parseMessageEvent } from './utils/parse'

/**
 * Configuration for EdenWS.
 */
export type EdenWsOptions = {
  /**
   * Custom transformer for messages.
   */
  transformer?: DataTransformerOptions
}

/**
 * Strongly-typed websocket event.
 *
 * Messages will be formatted, all other events will not be transformed.
 */
export type WSEvent<K extends keyof WebSocketEventMap, Data = unknown> = K extends 'message'
  ? OnMessage<Data>
  : WebSocketEventMap[K]

/**
 * Attempt to parse the message, in addition to providing the original raw value (string).
 */
export interface OnMessage<Data = unknown> extends MessageEvent {
  data: Data
  rawData: MessageEvent['data']
}

/**
 * Custom implementation of the EdenWS class.
 *
 * Some properties are auto-bound methods so you can pass them as callbacks without "this is undefined" errors.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/Arrow_functions#cannot_be_used_as_methods
 *
 * @example
 * ```ts
 * import { EdenWs } from '@ap0nia/eden'
 *
 * const edenWs = new EdenWS()
 *
 * ['a', 'b', 'c'].forEach(edenWs.send)
 * ```
 */
export class EdenWS<T extends InputSchema<any> = {}> {
  ws: WebSocket

  transformer?: CombinedDataTransformer

  constructor(
    public url: string,
    public options?: EdenWsOptions,
  ) {
    this.ws = new WebSocket(url)
    this.transformer = options?.transformer ? getDataTransformer(options?.transformer) : undefined
  }

  /**
   * Close the websocket connection.
   */
  close() {
    this.ws.close()
    return this
  }

  /**
   * Send (strongly-typed) message(s) over the websocket connection.
   */
  send = async (data: MaybeArray<T['body']>) => {
    if (Array.isArray(data)) {
      await this.sendMany(data)
    } else {
      await this.sendSingle(data)
    }
    return this
  }

  /**
   * Send a single (strongly-typed) message.
   */
  sendMany = async (data: T['body'][]) => {
    await Promise.allSettled(data.map(this.sendSingle))
    return this
  }

  /**
   * Send a single (strongly-typed) message.
   */
  sendSingle = async (data: T['body']) => {
    const message = await this.transformSent(data)
    this.ws.send(message)
    return this
  }

  /**
   * Register a callback function that is called when a message is received.
   */
  subscribe(
    onMessage: (event: WSEvent<'message', T['response']>) => void,
    options?: boolean | AddEventListenerOptions,
  ) {
    return this.on('message', onMessage, options)
  }

  /**
   * Register a strongly typed callback function to be called on the specified websocket event.
   *
   * Alias for {@link addEventListener}.
   */
  on<K extends keyof WebSocketEventMap>(
    type: K,
    listener: (event: WSEvent<K, T['response']>) => void,
    options?: boolean | AddEventListenerOptions,
  ) {
    return this.addEventListener(type, listener, options)
  }

  /**
   * Remove a registered event-listener.
   *
   * Alias for {@link removeEventListener}.
   */
  off<K extends keyof WebSocketEventMap>(
    type: K,
    listener: (this: WebSocket, ev: WebSocketEventMap[K]) => any,
    options?: boolean | EventListenerOptions,
  ) {
    this.removeEventListener(type, listener, options)
    return this
  }

  /**
   * Register a strongly typed callback function to be called on the specified websocket event.
   */
  addEventListener<K extends keyof WebSocketEventMap>(
    type: K,
    listener: (event: WSEvent<K, T['response']>) => void,
    options?: boolean | AddEventListenerOptions,
  ) {
    const resolvedEventListener = async (ws: WebSocketEventMap[K]) => {
      let event: any = ws

      if (type === 'message') {
        const data = (await this.transformReceived(event)) ?? parseMessageEvent(event)
        event = { ...ws, data }
      }

      listener(event)
    }

    this.ws.addEventListener(type, resolvedEventListener, options)
    return this
  }

  /**
   * Remove a registered event-listener.
   */
  removeEventListener<K extends keyof WebSocketEventMap>(
    type: K,
    listener: (this: WebSocket, ev: WebSocketEventMap[K]) => any,
    options?: boolean | EventListenerOptions,
  ) {
    this.ws.removeEventListener(type, listener, options)
    return this
  }

  /**
   * Transform outgoing messages sent from the client to the server.
   *
   * @internal
   */
  transformSent = async (data: T['body']) => {
    const serialize = this.transformer?.input.serialize

    let transformed: any

    try {
      transformed = await serialize?.(data)
    } catch (_err) {
      // noop
    }

    if (transformed == null) {
      transformed ??= typeof data === 'object' ? JSON.stringify(data) : data.toString()
    }

    return transformed
  }

  /**
   * Transform incoming messages received from the server.
   *
   * @internal
   */
  transformReceived = async (event: MessageEvent) => {
    const deserialize = this.transformer?.output.deserialize

    if (deserialize == null) return

    try {
      let messageString = event.data

      if (typeof messageString !== 'string') {
        messageString = event.data.toString()
      }

      const transformed = await deserialize(messageString)
      return transformed
    } catch (_err) {
      return
    }
  }
}

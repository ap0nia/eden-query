import type { InputSchema, MaybeArray } from 'elysia'

import { parseMessageEvent } from './utils/parse'

export interface OnMessage<Data = unknown> extends MessageEvent {
  data: Data
  rawData: MessageEvent['data']
}

export type WSEvent<K extends keyof WebSocketEventMap, Data = unknown> = K extends 'message'
  ? OnMessage<Data>
  : WebSocketEventMap[K]

export class EdenWS<T extends InputSchema<any> = {}> {
  ws: WebSocket

  constructor(public url: string) {
    this.ws = new WebSocket(url)
  }

  send(data: MaybeArray<T['body'] | T['body']>) {
    if (Array.isArray(data)) {
      data.forEach((datum) => this.send(datum))

      return this
    }

    this.ws.send(typeof data === 'object' ? JSON.stringify(data) : data.toString())

    return this
  }

  on<K extends keyof WebSocketEventMap>(
    type: K,
    listener: (event: WSEvent<K, T['response']>) => void,
    options?: boolean | AddEventListenerOptions,
  ) {
    return this.addEventListener(type, listener, options)
  }

  off<K extends keyof WebSocketEventMap>(
    type: K,
    listener: (this: WebSocket, ev: WebSocketEventMap[K]) => any,
    options?: boolean | EventListenerOptions,
  ) {
    this.ws.removeEventListener(type, listener, options)

    return this
  }

  subscribe(
    onMessage: (event: WSEvent<'message', T['response']>) => void,
    options?: boolean | AddEventListenerOptions,
  ) {
    return this.addEventListener('message', onMessage, options)
  }

  addEventListener<K extends keyof WebSocketEventMap>(
    type: K,
    listener: (event: WSEvent<K, T['response']>) => void,
    options?: boolean | AddEventListenerOptions,
  ) {
    this.ws.addEventListener(
      type,
      (ws) => {
        if (type === 'message') {
          const data = parseMessageEvent(ws as MessageEvent)
          listener({ ...ws, data } as any)
        } else {
          listener(ws as any)
        }
      },
      options,
    )

    return this
  }

  removeEventListener<K extends keyof WebSocketEventMap>(
    type: K,
    listener: (this: WebSocket, ev: WebSocketEventMap[K]) => any,
    options?: boolean | EventListenerOptions,
  ) {
    this.off(type, listener, options)

    return this
  }

  close() {
    this.ws.close()

    return this
  }
}

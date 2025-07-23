type EventListener<T = any> = (event: T) => void

class EventEmitter<T = any> {
  private listeners: {
    [K in keyof T]?: Set<EventListener<T[K]>>
  } = {}

  private onceListeners: {
    [K in keyof T]?: Set<EventListener<T[K]>>
  } = {}

  private scopedListeners: {
    [K in keyof T]?: Record<string, Set<EventListener<T[K]>>>
  } = {}

  addEventListener = <K extends keyof T>(
    type: K,
    listener: EventListener<T[K]>,
    optionsOrCapture?: AddEventListenerOptions | boolean,
  ) => {
    const options =
      typeof optionsOrCapture === 'boolean' ? { capture: optionsOrCapture } : optionsOrCapture || {}

    if (options.once) {
      this.onceListeners[type] ||= new Set()
      this.onceListeners[type].add(listener)
    } else {
      this.listeners[type] ||= new Set()
      this.listeners[type].add(listener)
    }
  }

  addScopedEventListener = <K extends keyof T>(
    id: string,
    type: K,
    listener: EventListener<T[K]>,
    // optionsOrCapture?: AddEventListenerOptions | boolean,
  ) => {
    // const options =
    //   typeof optionsOrCapture === 'boolean' ? { capture: optionsOrCapture } : optionsOrCapture || {}

    this.scopedListeners[type] ||= {}
    this.scopedListeners[type][id] ||= new Set()
    this.scopedListeners[type][id].add(listener)
  }

  removeEventListener = <K extends keyof T>(type: K, listener: EventListener<T[K]>) => {
    this.listeners[type]?.delete(listener)
    this.onceListeners[type]?.delete(listener)
  }

  dispatchEvent = <K extends keyof T>(type: K, event: T[K]): boolean => {
    this.listeners[type]?.forEach((listener) => listener(event))

    this.onceListeners[type]?.forEach((listener) => listener(event))

    const id = (event as MessageEvent).data.clientId

    if (id) {
      this.scopedListeners[type]?.[id]?.forEach((listener) => listener(event))
    }

    delete this.onceListeners[type]

    return true
  }
}

export default EventEmitter

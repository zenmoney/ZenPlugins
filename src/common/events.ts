/** Shared event emitter; see [semantics](../../docs/plugins/runtime.md#event-emitters). */
export interface EventSource<Events extends { [Event in keyof Events]: unknown[] } = Record<string, unknown[]>> {
  on: <Event extends keyof Events & string>(event: Event, listener: (...args: Events[Event]) => void) => this
  once: <Event extends keyof Events & string>(event: Event, listener: (...args: Events[Event]) => void) => this
  off: <Event extends keyof Events & string>(event: Event, listener: (...args: Events[Event]) => void) => this
  listenerCount: <Event extends keyof Events & string>(event: Event, listener?: (...args: Events[Event]) => void) => number
}

export interface EventEmitter<Events extends { [Event in keyof Events]: unknown[] } = Record<string, unknown[]>> extends EventSource<Events> {
  emit: <Event extends keyof Events & string>(event: Event, ...args: Events[Event]) => boolean
}

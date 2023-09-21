import { invokeFunction, toArray } from './util'
import {
    EventName,
    EventPayloadByEventName,
    EventPayloads,
    EventCallback,
    AllEventPayloads,
    EventCallbackByEventName
} from 'janus/types/events'

type EventMap = {
    '*'?: Array<EventCallback<AllEventPayloads>>
} & {
    [K in EventName]?: Array<EventCallback<EventPayloads[K]>>;
}

class EventEmitter {
    private events: EventMap = {}

    constructor () {}

    /**
   * Emits an event
   * @param {string} event name
   * @param {object} payload
   */
    public emit <Event extends EventName, Payload extends EventPayloadByEventName<Event>> (event: Event, payload: Payload = null) {
        let callbacks: Array<EventCallback<unknown>> = this.events[event]
        const allEventsCallbacks: Array<EventCallback<unknown>> = this.events['*']

        if (!callbacks) {
            return
        }

        if (allEventsCallbacks) {
            callbacks = callbacks.concat(allEventsCallbacks)
        }

        callbacks = callbacks.length > 1 ? toArray(callbacks) : callbacks

        for (let i = 0, l = callbacks.length; i < l; i++) {
            invokeFunction(callbacks[i], payload)
        }
    }

    /**
   * Listens for a given event
   * @param {string} event name
   * @param {function} fn
   */
    public on <Event extends EventName, Fn extends EventCallbackByEventName<Event>> (event: Event, fn: Fn) {
        if (typeof event !== 'string') {
            return
        }

        let handlers = this.events[event]

        if (!handlers) {
            this.events[event] = []
            handlers = this.events[event]
        }

        handlers.push(fn)
    }

    public once<Event extends EventName, Payload extends EventPayloadByEventName<Event>, Fn extends EventCallbackByEventName<Event>> (event: Event, fn: Fn) {
        const on: EventCallback<Payload> & { fn?: EventCallback<Payload> } = (...args: unknown[]) => {
            this.off(event, on)
            fn.apply(this, args)
        }

        on.fn = fn

        this.on(event, on)
    }

    public off <Event extends EventName, Fn extends EventCallbackByEventName<Event>> (event: Event, fn: Fn) {
        // all
        if (!arguments.length) {
            this.events = Object.create(null)
            return
        }

        // specific event
        const callbacks = this.events[event]
        if (!callbacks) {
            return
        }
        if (!fn) {
            this.events[event] = null
            return
        }
        // specific handler
        let cb
        let i = callbacks.length
        while (i--) {
            cb = callbacks[i]
            if (cb === fn || cb.fn === fn) {
                callbacks.splice(i, 1)
                break
            }
        }
    }
}

export default EventEmitter

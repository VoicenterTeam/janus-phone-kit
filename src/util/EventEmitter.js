import { invokeFunction, toArray } from "./util";


class EventEmitter {
  #events = {}

  constructor() {}

  /**
   * Emits an event
   * @param {string} event name
   */
  emit(event) {
    let callbacks = this.#events[event]

    if (!callbacks) {
      return
    }
    callbacks = callbacks.length > 1 ? toArray(callbacks) : callbacks
    const args = toArray(arguments, 1)
    for (let i = 0, l = callbacks.length; i < l; i++) {
      invokeFunction(callbacks[i], args)
    }
  }

  /**
   * Listens for a given event
   * @param {string} event name
   * @param {function} fn
   */
  on(event, fn) {
    let handlers = this.#events[event]
    if (!handlers) {
      this.#events[event] = []
      handlers = this.#events[event]
    }
    handlers.push(fn)
  }

  once(event, fn) {
    const on = () => {
      this.off(event, on)
      fn.apply(this, arguments)
    }
    on.fn = fn
    this.on(event, on)
  }

  off(event, fn) {
    // all
    if (!arguments.length) {
      this.#events = Object.create(null)
      return
    }

    // specific event
    const callbacks = this.#events[event]
    if (!callbacks) {
      return
    }
    if (!fn) {
      this.#events[event] = null
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

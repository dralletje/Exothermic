const EventEmitter = events => {
  let eventListeners =
    events.reduce((obj, key) => {
      obj[key] = []
      return obj
    }, {})


  const ensureEvent = event => {
    if (eventListeners[event] === undefined) {
      throw new Error(`Event ${event} does not exist on this emitter`)
    }
  }

  // Methods
  const on = (event, fn) => {
    ensureEvent(event)
    eventListeners[event] = eventListeners[event].concat([fn])
    return fn
  }
  const off = (event, fn) => {
    ensureEvent(event)
    eventListeners[event] = eventListeners[event].filter(x => x !== fn)
  }
  const once = (event, fn) => {
    const unbindFn = on(event, x => {
      fn(x)
      off(event, unbindFn)
    })
  }
  const emit = (event, ...args) => {
    ensureEvent(event)
    eventListeners[event].forEach(listener => listener(...args))
  }
  const listeners = event => {
    ensureEvent(event)
    return eventListeners[event]
  }
  const listenerCount = event => {
    return eventListeners(event).length
  }

  return {
    on, off, once, emit,
    listeners, listenerCount,
  }
}

export default EventEmitter

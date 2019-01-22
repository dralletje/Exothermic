const EventEmitter = (events) => {
  let eventListeners = {};
  // Add empty listeners array for every event
  for (let event of events) {
    eventListeners[event] = [];
  }

  const ensureEvent = (event) => {
    if (eventListeners[event] === undefined) {
      throw new Error(`Event ${String(event)} does not exist on this emitter`);
    }
  };

  // Methods
  const on = (event, fn) => {
    ensureEvent(event);
    eventListeners[event] = eventListeners[event].concat([fn]);
    return fn;
  };
  const off = (event, fn) => {
    ensureEvent(event);
    eventListeners[event] = eventListeners[event].filter((x) => x !== fn);
  };
  const once = (event, fn) => {
    ensureEvent(event);
    const unbindFn = on(event, (x) => {
      fn(x);
      off(event, unbindFn);
    });
  };
  const emit = (event, ...args) => {
    ensureEvent(event);
    eventListeners[event].forEach((listener) => listener(...args));
  };
  const listeners = (event) => {
    ensureEvent(event);
    return eventListeners[event];
  };
  const listenerCount = (event) => {
    return eventListeners(event).length;
  };
  const removeAllListeners = (event_name) => {
    if (event_name != null) {
      eventListeners[event_name] = [];
    } else {
      for (let event of events) {
        eventListeners[event] = [];
      }
    }
  };
  const eventNames = () => {
    return events;
  }

  return {
    on,
    off,
    once,
    emit,
    listeners,
    listenerCount,
    eventNames,
    removeAllListeners,
  };
};

export default EventEmitter;

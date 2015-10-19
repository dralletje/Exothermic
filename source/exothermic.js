const possibleEvents = ['value']
const rootKey = Symbol('Root of the state tree')

const timeout = (fn, delay) => {
  if (delay === 0) {
    setImmediate(fn)
  }
  if (delay < 0) {
    fn()
  }
  if (delay > 0) {
    setTimeout(fn, delay)
  }
}

const eventEmitter = events => {
  const listeners =
    events.reduce((obj, key) => {
      obj[key] = []
      return obj
    }, {})


  const ensureEvent = event => {
    if (listeners[event] === undefined) {
      throw new Error(`Event ${event} does not exist on this emitter`)
    }
  }

  const methods = {
    on: (event, fn) => {
      ensureEvent(event)
      listeners[event] = listeners[event].concat([fn])
      return fn
    },
    off: (event, fn) => {
      ensureEvent(event)
      listeners[event] = listeners[event].filter(x => x !== fn)
    },
    once: (event, fn) => {
      const unbindFn = methods.on(event, x => {
        fn(x)
        methods.off(event, unbindFn)
      })
    },

    emit: (event, ...args) => {
      ensureEvent(event)
      listeners[event].forEach(listener => listener(...args))
    },
    listeners: event => {
      ensureEvent(event)
      return listeners[event]
    },
    listenerCount: event => {
      ensureEvent(event)
      return listeners[event].length
    },
  }

  return methods
}

const firebasechild = (parent, key, options) => {
  const {delay} = options
  const emitter = eventEmitter(possibleEvents)
  const snapshot = () => {
    const val = parent.get(key)
    return {
      val: () => val,
      key: () => key,
    }
  }

  let children = {}

  const methods = {
    ...emitter,
    on: (event, fn) => {
      if (event === 'value') {
        timeout(_ => fn(snapshot()), delay)
      }
      return emitter.on(event, fn)
    },
    once: (event, fn) => {
      // Go back to your non-realtime relation database!
      throw new Error('You really shouldn\'t use once.')
    },

    child: path => {
      const [first, ...tail] = Array.isArray(path) ? path : path.split('/')
      const child = children[first] || firebasechild(methods, first, options)
      children = {
        ...children,
        [first]: child,
      }
      return tail.length === 0 ? child : child.child(tail)
    },
    set: value => {
      parent.update({ [key]: value })
      emitter.emit('value', snapshot())
    },
    update: value => {
      parent.update({
        [key]: {
          ...parent.get(key),
          ...value,
        },
      })
      emitter.emit('value', snapshot())
    },

    // Implementation
    get: prop => (
      parent.get(key)[prop]
    ),
  }
  return methods
}

const exothermic = (initdata, {delay = 0} = {}) => {
  let data = initdata

  const root = {
    get: _ => {
      return data
    },
    update: value => {
      data = {
        ...data,
        ...value[rootKey],
      }
    },
  }

  return firebasechild(root, rootKey, {delay})
}

export default exothermic

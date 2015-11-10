import EventEmitter from './EventEmitter'
import pushId from './pushId'

const possibleEvents = ['value']

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

const createSnapshot = ({key, value}) => {
  return {
    val: () => value,
    key: () => key,
  }
}

const firebasechild = (parent, key, options) => {
  const {delay} = options
  const emitter = EventEmitter(possibleEvents)
  const snapshot = () => {
    const value = parent.__get(key)
    return createSnapshot({key, value})
  }

  let children = {}

  // If parent changes, you change too
  //@TODO: Maybe compare to old value? No?
  parent.on('value', () => emitter.emit('value', snapshot()))

  const set = (value, cb) => {
    parent.update({ [key]: value })
    emitter.emit('value', snapshot())
    if (typeof cb === 'function') {
      cb(null)
    }
  }

  const update = (value, cb) => {
    set({
      ...parent.__get(key),
      ...value,
    }, cb)
  }

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
    set: set,
    update: update,
    remove: cb => {
      set(null, cb)
    },
    push: (value, cb) => {
      const id = pushId()
      update({ [id]: value }, cb)
      return createSnapshot({key: id, value})
    },

    // Implementation
    __get: prop => {
      const me = parent.__get(key)
      const val = typeof me === 'object' && me !== null ? me[prop] : {}

      return (
        val === undefined ||
        val === null ||
        (typeof val === 'object' && Object.keys(val).length === 0)
        ? null
        : val
      )
    },
    __emitWhenChanged: oldValue => {
      emitter.emit('value', snapshot())
    },
  }
  return methods
}

export default firebasechild

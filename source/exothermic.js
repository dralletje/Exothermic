import EventEmitter from './EventEmitter'

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



const firebasechild = (parent, key, options) => {
  const {delay} = options
  const emitter = EventEmitter(possibleEvents)
  const snapshot = () => {
    const val = parent.__get(key)
    return {
      val: () => val,
      key: () => key,
    }
  }

  let children = {}

  // If parent changes, you change too
  //@TODO: Maybe compare to old value? No?
  parent.on('value', () => emitter.emit('value', snapshot()))

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
          ...parent.__get(key),
          ...value,
        },
      })
      emitter.emit('value', snapshot())
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

const exothermic = (initdata, {delay = 0} = {}) => {
  let data = initdata

  const root = {
    __get: _ => {
      return data
    },
    update: value => {
      data = {
        ...data,
        ...value[rootKey],
      }
    },
    on: () => {},
  }

  return firebasechild(root, rootKey, {delay})
}

export default exothermic

import EventEmitter from './EventEmitter'
import DataSnapshot from './datasnapshot'

import pushId from './pushId'
import firebaseGetData from './firebaseGetData'

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


const firebasechild = (parent, key, options) => {
  const {delay} = options
  const emitter = EventEmitter(possibleEvents)

  const snapshot = () => {
    const value = parent.__get(key)
    return DataSnapshot({key, value, ref: methods})
  }

  let children = {}

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
      return DataSnapshot({key: id, value, ref: methods})
    },

    // Implementation
    __get: prop => firebaseGetData(parent.__get(key), prop),
    __emitWhenChanged: oldValue => {
      emitter.emit('value', snapshot())
    },
  }

  // If parent changes, you change too
  //@TODO: Maybe compare to old value? No?
  parent.on('value', () => emitter.emit('value', snapshot()))

  return methods
}

export default firebasechild

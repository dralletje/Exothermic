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

  const __emitRawEvent = (event) => {
    return parent.__emitRawEvent(event, key);
  };

  // The `event` param allows the root event to keep track of all the
  // mutations that are occuring, here or deeper
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
    off: (event, fn) => {
      const countBeforeRemove = emitter.listenerCount(event);
      const offResult = emitter.off(event, fn);
      const countAfterRemove = emitter.listenerCount(event);
      if (countBeforeRemove !== 0 && countAfterRemove === 0) {
        __emitRawEvent({
          type: 'unsubscription',
          path: '',
          event: event,
        });
      }
      return offResult;
    },
    on: (event, fn) => {
      if (event === 'value') {
        timeout(_ => fn(snapshot()), delay)
      }

      // Just starting to listen to this node for the first time,
      // so I need to emit a raw event for that
      const countBeforeListen = emitter.listenerCount(event);
      const onResult = emitter.on(event, fn);
      const countAfterListen = emitter.listenerCount(event);
      if (countBeforeListen === 0 && countAfterListen !== 0) {
        __emitRawEvent({
          type: 'subscription',
          path: '',
          event: event,
        });
      }
      return onResult;
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
    set: (value, ...args) => {
      __emitRawEvent({
        type: 'set',
        path: '',
        value: value,
      });
      return set(value, ...args);
    },
    update: (value, ...args) => {
      __emitRawEvent({
        type: 'update',
        path: '',
        value: value,
      });
      return update(value, ...args);
    },
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
    __emitRawEvent: (event, key) => {
      __emitRawEvent({
        ...event,
        path: `${key}/${event.path}`,
      });
    },
  }

  // If parent changes, you change too
  //@TODO: Maybe compare to old value? No?
  parent.on('value', () => emitter.emit('value', snapshot()))

  return methods
}

export default firebasechild
